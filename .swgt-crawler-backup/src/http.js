// HTTP 层:限速 + 重试 + gzip 磁盘缓存(可断点续爬、离线重解析)
// 缓存以 URL 哈希命名存放 data/raw/<sha1>.html.gz + .meta.json
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  BASE_URL, HEADERS, RAW_DIR, REQUEST_DELAY_MS, JITTER_MS,
  REQUEST_TIMEOUT_MS, MAX_RETRIES,
} from './config.js';

mkdirSync(RAW_DIR, { recursive: true });

export const httpStats = {
  fetched: 0, cacheHits: 0, errors: 0, bytes: 0,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastRequestAt = 0;

export function cacheKey(url) {
  return createHash('sha1').update(url).digest('hex');
}

function cachePaths(url) {
  const key = cacheKey(url);
  return {
    body: path.join(RAW_DIR, `${key}.html.gz`),
    meta: path.join(RAW_DIR, `${key}.meta.json`),
  };
}

/** 列出当前缓存里的全部 meta(重建队列/离线分析用) */
export function listCache() {
  const out = [];
  if (!existsSync(RAW_DIR)) return out;
  for (const f of readdirSync(RAW_DIR)) {
    if (!f.endsWith('.meta.json')) continue;
    try { out.push(JSON.parse(readFileSync(path.join(RAW_DIR, f), 'utf8'))); } catch { /* 跳过 */ }
  }
  return out;
}

import { readdirSync } from 'node:fs';

async function politeDelay() {
  const wait = REQUEST_DELAY_MS + Math.floor(Math.random() * JITTER_MS);
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < wait) await sleep(wait - elapsed);
}

async function fetchOnce(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: ctrl.signal });
    const body = await res.text();
    return { status: res.status, body, finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 抓取 URL 文本。默认命中磁盘缓存直接返回(不访问网络)。
 * @param {string} urlPath 以 / 开头的路径或完整 URL
 * @param {{fresh?: boolean, useCache?: boolean}} opts
 */
export async function fetchHtml(urlPath, opts = {}) {
  const url = urlPath.startsWith('http') ? urlPath : BASE_URL + urlPath;
  const { body: bodyFile, meta: metaFile } = cachePaths(url);
  const useCache = opts.useCache !== false;

  if (!opts.fresh && useCache && existsSync(bodyFile) && existsSync(metaFile)) {
    try {
      const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
      if (meta.status >= 200 && meta.status < 300) {
        httpStats.cacheHits++;
        return { html: gunzipSync(readFileSync(bodyFile)).toString('utf8'), fromCache: true, ...meta };
      }
    } catch {
      // 缓存损坏则重新抓取
    }
  }

  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    await politeDelay();
    lastRequestAt = Date.now();
    try {
      const { status, body, finalUrl } = await fetchOnce(url);
      httpStats.fetched++;
      httpStats.bytes += body.length;
      if (status >= 200 && status < 300) {
        const meta = { url, finalUrl, status, fetchedAt: new Date().toISOString() };
        writeFileSync(bodyFile, gzipSync(Buffer.from(body, 'utf8')));
        writeFileSync(metaFile, JSON.stringify(meta));
        return { html: body, fromCache: false, ...meta };
      }
      if (status === 404) return { html: body, fromCache: false, url, finalUrl, status };
      // 429/5xx 重试,退避递增
      lastErr = new Error(`HTTP ${status} for ${url}`);
      await sleep(3000 * attempt);
    } catch (err) {
      lastErr = err;
      httpStats.errors++;
      await sleep(3000 * attempt);
    }
  }
  throw lastErr ?? new Error(`fetch failed: ${url}`);
}
