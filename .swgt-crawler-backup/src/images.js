// 图片下载阶段(并发池):从 DB + 原始 HTML 缓存收集引用,增量下载到 data/images/
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { db, now, transaction, startRun, finishRun } from './db.js';
import { RAW_DIR, DATA_DIR, EXPORT_DIR, HEADERS, REQUEST_TIMEOUT_MS, MAX_RETRIES, IMAGES_CONCURRENCY } from './config.js';

export const CDN_BASE = 'https://do9d4mpqk497d.cloudfront.net/common/images';
export const IMAGES_DIR = path.join(DATA_DIR, 'images');

const IMAGE_DIRS = new Set([
  'monsters', 'monsters36', 'skills', 'skills36', 'leader_skills', 'leader_skills36',
  'skill_effects', 'skill_effects36', 'elements', 'elements36',
  'artifacts', 'artifacts36', 'relics', 'relics36', 'worldboss',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequestAt = 0;

async function politeDelay() {
  const wait = 250 + Math.floor(Math.random() * 100);
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < wait) await sleep(wait - elapsed);
}

function log(...args) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...args);
}

function collectRefs() {
  const refs = new Map();
  const add = (dir, file) => {
    if (!file) return;
    if (!refs.has(dir)) refs.set(dir, new Set());
    refs.get(dir).add(file);
  };

  for (const r of db.prepare('SELECT image FROM monsters WHERE image IS NOT NULL').all()) {
    add('monsters36', r.image);
    add('monsters', r.image);
  }
  for (const r of db.prepare('SELECT icon FROM monster_skills WHERE icon IS NOT NULL').all()) {
    add('skills', r.icon);
    add('skills36', r.icon);
  }

  const imgRe = /\/common\/images\/([a-z0-9_]+)\/([A-Za-z0-9_.\-]+\.(?:png|jpe?g|gif|webp))/g;
  const skipped = new Map();
  if (existsSync(RAW_DIR)) {
    for (const f of readdirSync(RAW_DIR)) {
      if (!f.endsWith('.html.gz')) continue;
      try {
        const html = gunzipSync(readFileSync(path.join(RAW_DIR, f))).toString('utf8');
        let m;
        while ((m = imgRe.exec(html)) !== null) {
          if (IMAGE_DIRS.has(m[1])) add(m[1], m[2]);
          else skipped.set(m[1], (skipped.get(m[1]) ?? 0) + 1);
        }
      } catch { /* 跳过损坏缓存 */ }
    }
  }
  if (skipped.size) log(`images: 忽略非游戏目录: ${[...skipped.entries()].map(([d, n]) => `${d}(${n})`).join(', ')}`);
  return refs;
}

async function downloadOne(dir, file) {
  const url = `${CDN_BASE}/${dir}/${encodeURIComponent(file)}`;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await politeDelay();
    lastRequestAt = Date.now();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
      const res = await fetch(url, { headers: { ...HEADERS, Referer: 'https://swgt.io/' }, signal: ctrl.signal });
      clearTimeout(timer);
      if (res.status === 404) return { status: 404, error: 'not found' };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      return { status: 200, buf };
    } catch (e) {
      if (attempt === MAX_RETRIES) return { status: 0, error: e.message };
      await sleep(2000 * attempt);
    }
  }
  return { status: 0, error: 'unreachable' };
}

function statSyncSafe(p) {
  try {
    return statSync(p).size;
  } catch {
    return 0;
  }
}

export async function stageImages(opts = {}) {
  const runId = startRun('images');
  const refs = collectRefs();
  const total = [...refs.values()].reduce((a, s) => a + s.size, 0);
  log(`images: 收集到 ${total} 个引用 (并发 ${IMAGES_CONCURRENCY}),目录分布: ${[...refs.entries()].map(([d, s]) => `${d}=${s.size}`).join(' ')}`);

  const upsert = db.prepare(`
    INSERT INTO images(dir, file, url, local_path, bytes, status, error, fetched_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(dir, file) DO UPDATE SET
      url = excluded.url, local_path = excluded.local_path,
      bytes = excluded.bytes, status = excluded.status,
      error = excluded.error, fetched_at = excluded.fetched_at
  `);

  const tasks = [];
  for (const [dir, files] of refs) {
    mkdirSync(path.join(IMAGES_DIR, dir), { recursive: true });
    for (const file of files) tasks.push([dir, file]);
  }
  if (opts.limit != null) tasks.length = Math.min(tasks.length, opts.limit);

  let done = 0;
  let skipped = 0;
  let errors = 0;
  let idx = 0;
  let pendingRows = [];
  const flush = () => {
    if (!pendingRows.length) return;
    const rows = pendingRows;
    pendingRows = [];
    transaction(() => {
      for (const r of rows) upsert.run(...r);
    });
  };

  const worker = async () => {
    while (idx < tasks.length) {
      const [dir, file] = tasks[idx++];
      const localPath = path.join(IMAGES_DIR, dir, file);
      if (!opts.fresh && existsSync(localPath) && statSyncSafe(localPath) > 0) {
        skipped++;
        pendingRows.push([dir, file, `${CDN_BASE}/${dir}/${file}`, localPath, statSyncSafe(localPath), 'done', null, now()]);
        if (pendingRows.length >= 200) flush();
        continue;
      }
      const r = await downloadOne(dir, file);
      if (r.status === 200) {
        writeFileSync(localPath, r.buf);
        pendingRows.push([dir, file, `${CDN_BASE}/${dir}/${file}`, localPath, r.buf.length, 'done', null, now()]);
        done++;
      } else {
        errors++;
        pendingRows.push([dir, file, `${CDN_BASE}/${dir}/${file}`, localPath, null, 'error', r.error ?? String(r.status), now()]);
        if (r.status === 404) log(`images: 404 ${dir}/${file}`);
      }
      if (pendingRows.length >= 200) flush();
      if ((done + errors) % 200 === 0) log(`images: 已下载 ${done}, 跳过(已有) ${skipped}, 失败 ${errors}`);
    }
  };
  await Promise.all(Array.from({ length: IMAGES_CONCURRENCY }, () => worker()));
  flush();

  mkdirSync(EXPORT_DIR, { recursive: true });
  const manifest = { generated_at: now(), cdn_base: CDN_BASE, counts: {}, files: [] };
  for (const [dir, files] of refs) {
    manifest.counts[dir] = files.size;
    for (const file of files) manifest.files.push({ dir, file, url: `${CDN_BASE}/${dir}/${file}` });
  }
  writeFileSync(path.join(EXPORT_DIR, 'images.json'), JSON.stringify(manifest));
  writeFileSync(path.join(EXPORT_DIR, 'images_manifest.json'),
    JSON.stringify({ generated_at: manifest.generated_at, cdn_base: CDN_BASE, counts: manifest.counts }, null, 2));

  log(`images: 完成 下载=${done} 已有=${skipped} 失败=${errors}; manifest 已写入 export/images.json`);
  finishRun(runId, done, errors, `skipped=${skipped}`);
  return { done, skipped, errors, total };
}
