// 备份:VACUUM INTO 一致性快照 -> gzip,双位置保存
//   1) data/backup/swgt-<时间戳>.db.gz (保留最近 BACKUP_KEEP 份)
//   2) ../.swgt-crawler-backup/swgt-latest.db.gz (目录外镜像,防整个项目目录被误删)
// 同时把源码打包镜像到目录外,保证源码+数据都可恢复
import { execSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, cpSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { db, now, setMeta } from './db.js';
import { DATA_DIR, BACKUP_DIR, MIRROR_BACKUP_DIR, ROOT, BACKUP_KEEP } from './config.js';

function ts() {
  return new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
}

export function stageBackup() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  mkdirSync(MIRROR_BACKUP_DIR, { recursive: true });

  // 1. SQLite 一致性快照(VACUUM INTO,可在 WAL 活动时安全执行)
  const rawSnap = path.join(DATA_DIR, `.snapshot-${process.pid}.db`);
  const gzName = `swgt-${ts()}.db.gz`;
  const gzPath = path.join(BACKUP_DIR, gzName);
  try {
    db.exec(`VACUUM INTO '${rawSnap.replace(/\\/g, '/')}'`);
    const gz = gzipSync(readFileSync(rawSnap), { level: 6 });
    writeFileSync(gzPath, gz);
    // 目录外镜像(最新一份,总是覆盖)
    writeFileSync(path.join(MIRROR_BACKUP_DIR, 'swgt-latest.db.gz'), gz);
    setMeta('last_backup_at', now());
  } finally {
    try { unlinkSync(rawSnap); } catch { /* 忽略 */ }
  }

  // 2. 清理旧备份,保留最近 BACKUP_KEEP 份;顺带清理 30 天前的日志
  const files = readdirSync(BACKUP_DIR).filter((f) => /^swgt-.*\.db\.gz$/.test(f)).sort();
  for (const f of files.slice(0, Math.max(0, files.length - BACKUP_KEEP))) {
    try { unlinkSync(path.join(BACKUP_DIR, f)); } catch { /* 忽略 */ }
  }
  const LOG_DIR = path.join(DATA_DIR, 'logs');
  if (existsSync(LOG_DIR)) {
    const cutoff = Date.now() - 30 * 86400_000;
    for (const f of readdirSync(LOG_DIR)) {
      try {
        if (f.endsWith('.log') && statSync(path.join(LOG_DIR, f)).mtimeMs < cutoff) {
          unlinkSync(path.join(LOG_DIR, f));
        }
      } catch { /* 忽略 */ }
    }
  }

  // 3. 源码镜像到目录外(含 README/package.json/.gitignore/src)
  try {
    const srcMirror = path.join(MIRROR_BACKUP_DIR, 'src');
    cpSync(path.join(ROOT, 'src'), srcMirror, { recursive: true, force: true });
    for (const f of ['package.json', 'README.md', '.gitignore']) {
      const p = path.join(ROOT, f);
      if (existsSync(p)) cpSync(p, path.join(MIRROR_BACKUP_DIR, f), { force: true });
    }
  } catch (e) {
    console.log(`backup: 源码镜像失败 ${e.message}`);
  }

  const sizeMb = (readFileSync(gzPath).length / 1024 / 1024).toFixed(1);
  console.log(`backup: ${gzName} (${sizeMb}MB) + 目录外镜像 ${MIRROR_BACKUP_DIR}`);
  return gzPath;
}
