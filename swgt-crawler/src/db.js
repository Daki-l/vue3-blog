// SQLite 存储(node:sqlite 内置,零依赖)
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { DB_PATH, DATA_DIR } from './config.js';

mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 10000;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS monsters (
  com2us_id       INTEGER PRIMARY KEY,
  name            TEXT,
  unawakened_name TEXT,
  family          TEXT,
  collab          TEXT,
  element         TEXT,
  archetype       TEXT,
  natural_stars   INTEGER,
  image           TEXT,
  awaken_bonus    TEXT,
  leader_skill    TEXT,   -- JSON {icon, text}
  awakening_chain TEXT,   -- JSON [com2usId...]
  stats           TEXT,   -- JSON {hp:{value,min,max,isPercent},...}
  skills          TEXT,   -- JSON [完整技能对象]
  extra           TEXT,   -- JSON:目录页标签等杂项
  detail_done     INTEGER DEFAULT 0,
  first_seen      TEXT,
  last_seen       TEXT,
  content_hash    TEXT
);

CREATE TABLE IF NOT EXISTS monster_skills (
  com2us_id  INTEGER NOT NULL,
  slot       INTEGER NOT NULL,
  name       TEXT,
  icon       TEXT,
  level_text TEXT,
  description TEXT,
  skillups   TEXT,
  effects    TEXT,
  scales_with TEXT,
  multiplier TEXT,
  PRIMARY KEY (com2us_id, slot)
);

-- 3MDC:三魔灵防守
CREATE TABLE IF NOT EXISTS defenses (
  defense_id    INTEGER PRIMARY KEY,
  monster_leader INTEGER,
  monster2      INTEGER,
  monster3      INTEGER,
  monster_names TEXT,
  contributor   TEXT,
  created_at    TEXT,
  counter_count INTEGER,
  first_seen    TEXT,
  last_seen     TEXT
);

-- 3MDC:针对某防守的克制队伍
CREATE TABLE IF NOT EXISTS counters (
  counter_id    INTEGER PRIMARY KEY,
  defense_id    INTEGER NOT NULL,
  monster1      INTEGER,
  monster2      INTEGER,
  monster3      INTEGER,
  monster_names TEXT,
  contributor   TEXT,
  created_at    TEXT,
  rating_avg    REAL,
  rating_count  INTEGER,
  first_seen    TEXT,
  last_seen     TEXT
);

CREATE TABLE IF NOT EXISTS counter_strategies (
  counter_id  INTEGER NOT NULL,
  strategy_id INTEGER,
  text        TEXT,
  author      TEXT,
  created_at  TEXT,
  votes_up    INTEGER DEFAULT 0,
  votes_down  INTEGER DEFAULT 0,
  PRIMARY KEY (counter_id, strategy_id)
) WITHOUT ROWID;

-- 可断点续跑的防守详情工作队列
CREATE TABLE IF NOT EXISTS defense_queue (
  defense_key    TEXT PRIMARY KEY,
  monster_leader INTEGER,
  monster2       INTEGER,
  monster3       INTEGER,
  status         TEXT DEFAULT 'pending',  -- pending|done|error|missing
  tries          INTEGER DEFAULT 0,
  counter_hint   INTEGER,  -- 魔灵页上看到的克制数,用于增量判断是否需要重抓
  last_error     TEXT,
  discovered_from TEXT,
  enqueued_at    TEXT,
  done_at        TEXT
);

-- 通用公开页面存档
CREATE TABLE IF NOT EXISTS pages (
  path         TEXT PRIMARY KEY,
  title        TEXT,
  text_content TEXT,
  links_found  TEXT,
  fetched_at   TEXT
);

-- 图片资产
CREATE TABLE IF NOT EXISTS images (
  dir         TEXT,
  file        TEXT,
  url         TEXT,
  local_path  TEXT,
  bytes       INTEGER,
  status      TEXT DEFAULT 'pending',
  error       TEXT,
  fetched_at  TEXT,
  PRIMARY KEY (dir, file)
);

CREATE TABLE IF NOT EXISTS crawl_runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  stage       TEXT,
  started_at  TEXT,
  finished_at TEXT,
  ok          INTEGER DEFAULT 0,
  error       INTEGER DEFAULT 0,
  notes       TEXT
);

CREATE INDEX IF NOT EXISTS idx_counters_defense ON counters(defense_id);
CREATE INDEX IF NOT EXISTS idx_strategies_counter ON counter_strategies(counter_id);
CREATE INDEX IF NOT EXISTS idx_queue_status ON defense_queue(status);
`);

// 旧库升级:defense_queue 增加 counter_hint 列
try {
  db.exec('ALTER TABLE defense_queue ADD COLUMN counter_hint INTEGER');
} catch { /* 已存在 */ }

export function now() {
  return new Date().toISOString();
}

/** 手动事务包裹(node:sqlite 没有 better-sqlite3 风格的 .transaction) */
export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getMeta(key) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function setMeta(key, value) {
  db.prepare(
    'INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, String(value));
}

export function startRun(stage) {
  const r = db
    .prepare('INSERT INTO crawl_runs(stage, started_at) VALUES(?, ?)')
    .run(stage, now());
  return Number(r.lastInsertRowid);
}

export function finishRun(id, ok, error, notes) {
  db.prepare(
    'UPDATE crawl_runs SET finished_at = ?, ok = ?, error = ?, notes = ? WHERE id = ?',
  ).run(now(), ok, error, notes ?? '', id);
}
