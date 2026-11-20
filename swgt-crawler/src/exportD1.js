// 生成 D1 导入用 SQL:每条 INSERT 按字节分批(<60KB,D1 单语句上限 100KB),
// 每个分卷文件 <=5MB,输出到 data/export/d1/
// 用法:
//   node src/cli.js exportd1            # 全量(INSERT OR REPLACE,可重复执行)
//   node src/cli.js exportd1 --since "2026-11-20T00:00:00"   # 只导出该时间后变更的行(增量)
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { db } from './db.js';
import { EXPORT_DIR } from './config.js';

const OUT_DIR = path.join(EXPORT_DIR, 'd1');
const BATCH_BYTES = 60 * 1024;
const FILE_BYTES = 5 * 1024 * 1024;

const q = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
};

export function runExportD1(opts = {}) {
  const since = opts.since ?? null;
  const tag = since ? `.since-${String(since).slice(0, 10)}` : '';
  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];
  let fileSeq = 0;

  const newFile = (table) => {
    const fname = `${String(++fileSeq).padStart(2, '0')}_${table}${tag}.sql`;
    const fpath = path.join(OUT_DIR, fname);
    return { fname, fpath, bytes: 0, statements: 0 };
  };

  const TABLES = [
    {
      name: 'monsters',
      schema: `CREATE TABLE IF NOT EXISTS monsters (
  com2us_id INTEGER PRIMARY KEY,
  name TEXT, unawakened_name TEXT, family TEXT, collab TEXT,
  element TEXT, archetype TEXT, natural_stars INTEGER, image TEXT,
  awaken_bonus TEXT, leader_skill TEXT, awakening_chain TEXT,
  stats TEXT, skills TEXT
);`,
      columns: ['com2us_id', 'name', 'unawakened_name', 'family', 'collab', 'element',
        'archetype', 'natural_stars', 'image', 'awaken_bonus', 'leader_skill',
        'awakening_chain', 'stats', 'skills'],
      sinceCol: 'last_seen',
    },
    {
      name: 'monster_skills',
      schema: `CREATE TABLE IF NOT EXISTS monster_skills (
  com2us_id INTEGER NOT NULL, slot INTEGER NOT NULL,
  name TEXT, icon TEXT, level_text TEXT, description TEXT,
  skillups TEXT, effects TEXT, scales_with TEXT, multiplier TEXT,
  PRIMARY KEY (com2us_id, slot)
);`,
      columns: ['com2us_id', 'slot', 'name', 'icon', 'level_text', 'description',
        'skillups', 'effects', 'scales_with', 'multiplier'],
      sinceCol: null, // 通过 monsters.last_seen 关联
      sinceJoin: 'JOIN monsters m ON m.com2us_id = monster_skills.com2us_id',
    },
    {
      name: 'defenses',
      schema: `CREATE TABLE IF NOT EXISTS defenses (
  defense_id INTEGER PRIMARY KEY,
  monster_leader INTEGER, monster2 INTEGER, monster3 INTEGER,
  monster_names TEXT, contributor TEXT, created_at TEXT, counter_count INTEGER
);`,
      columns: ['defense_id', 'monster_leader', 'monster2', 'monster3', 'monster_names',
        'contributor', 'created_at', 'counter_count'],
      sinceCol: null, // 本地表有 last_seen 但 D1 表没有该列,增量用子查询过滤
      sinceWhere: 'defense_id IN (SELECT defense_id FROM defenses_local_touched)',
    },
    {
      name: 'counters',
      schema: `CREATE TABLE IF NOT EXISTS counters (
  counter_id INTEGER PRIMARY KEY,
  defense_id INTEGER NOT NULL,
  monster1 INTEGER, monster2 INTEGER, monster3 INTEGER,
  monster_names TEXT, contributor TEXT, created_at TEXT,
  rating_avg REAL, rating_count INTEGER
);
CREATE INDEX IF NOT EXISTS idx_counters_defense ON counters(defense_id);`,
      columns: ['counter_id', 'defense_id', 'monster1', 'monster2', 'monster3',
        'monster_names', 'contributor', 'created_at', 'rating_avg', 'rating_count'],
      sinceCol: null,
    },
    {
      name: 'counter_strategies',
      schema: `CREATE TABLE IF NOT EXISTS counter_strategies (
  counter_id INTEGER NOT NULL, strategy_id INTEGER,
  text TEXT, author TEXT, created_at TEXT,
  votes_up INTEGER DEFAULT 0, votes_down INTEGER DEFAULT 0,
  PRIMARY KEY (counter_id, strategy_id)
) WITHOUT ROWID;`,
      columns: ['counter_id', 'strategy_id', 'text', 'author', 'created_at', 'votes_up', 'votes_down'],
      sinceCol: null,
    },
    {
      name: 'pages',
      schema: `CREATE TABLE IF NOT EXISTS pages (
  path TEXT PRIMARY KEY, title TEXT, text_content TEXT, fetched_at TEXT
);`,
      columns: ['path', 'title', 'text_content', 'fetched_at'],
      sinceCol: 'fetched_at',
    },
  ];

  // schema 文件(仅全量导出时生成)
  if (!since) {
    const schemaSql = TABLES.map((t) => t.schema).join('\n\n') + '\n';
    writeFileSync(path.join(OUT_DIR, '00_schema.sql'), schemaSql);
    manifest.push({ file: '00_schema.sql', table: '(schema)', rows: 0, statements: 1, bytes: schemaSql.length });
  }

  for (const t of TABLES) {
    // 组装增量过滤条件:本地表有 last_seen/fetched_at 的直接用;
    // defenses/counters/strategies 通过"本次触达的 defense_id"集合关联
    let where = '';
    if (since) {
      if (t.name === 'defenses') {
        where = `WHERE defense_id IN (SELECT defense_id FROM defenses WHERE last_seen >= '${since}')`;
      } else if (t.name === 'counters') {
        where = `WHERE defense_id IN (SELECT defense_id FROM defenses WHERE last_seen >= '${since}')`;
      } else if (t.name === 'counter_strategies') {
        where = `WHERE counter_id IN (SELECT counter_id FROM counters WHERE last_seen >= '${since}')`;
      } else if (t.sinceCol) {
        where = `WHERE ${t.sinceCol} >= '${since}'`;
      } else if (t.name === 'monster_skills') {
        where = `WHERE com2us_id IN (SELECT com2us_id FROM monsters WHERE last_seen >= '${since}')`;
      }
    }

    const rows = db.prepare(`SELECT ${t.columns.join(', ')} FROM ${t.name} ${where}`).all();
    let f = newFile(t.name);
    let batch = [];
    let batchBytes = 0;
    let rowsInFile = 0;
    const colList = t.columns.join(', ');

    const flushBatch = () => {
      if (!batch.length) return;
      const stmt = `INSERT OR REPLACE INTO ${t.name} (${colList}) VALUES\n${batch.join(',\n')};\n`;
      writeFileSync(f.fpath, stmt, { flag: 'a' });
      f.bytes += stmt.length;
      f.statements++;
      batch = [];
      batchBytes = 0;
    };
    const flushFile = () => {
      flushBatch();
      if (f.statements > 0) {
        manifest.push({ file: f.fname, table: t.name, rows: rowsInFile, statements: f.statements, bytes: f.bytes });
      }
    };

    for (const r of rows) {
      const vals = t.columns.map((c) => q(r[c])).join(', ');
      const rowBytes = vals.length + 4;
      if (batchBytes + rowBytes > BATCH_BYTES && batch.length) flushBatch();
      if (f.bytes + batchBytes + rowBytes > FILE_BYTES) {
        flushFile();
        f = newFile(t.name);
        rowsInFile = 0;
      }
      batch.push(`(${vals})`);
      batchBytes += rowBytes;
      rowsInFile++;
    }
    flushFile();
  }

  const totalRows = manifest.reduce((a, m) => a + m.rows, 0);
  writeFileSync(path.join(OUT_DIR, `manifest${tag || ''}.json`),
    JSON.stringify({ since, total_rows: totalRows, files: manifest }, null, 2));
  console.log(`D1 导出完成${since ? `(增量 since=${since})` : '(全量)'}: ${manifest.length} 个文件, 共 ${totalRows.toLocaleString()} 行`);
  for (const m of manifest) {
    console.log(`  ${m.file}: ${m.table} rows=${m.rows} stmts=${m.statements} ${(m.bytes / 1024).toFixed(0)}KB`);
  }
  return { totalRows, files: manifest.length };
}
