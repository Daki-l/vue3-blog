// 从 D1 远程库恢复本地 SQLite(目录/数据库被误删后的恢复路径)
// 用法: node src/cli.js restore
// 注意:会覆盖本地 defenses/counters 等数据表;monsters 详情字段若本地更新会以 D1 为准
import { db, now, transaction } from './db.js';
import { d1Query } from './d1api.js';
import { defenseKey } from './crawl.js';

const BATCH = 500;

async function pullTable(table, pk, columns) {
  const colList = columns.join(', ');
  let last = null;
  let total = 0;
  const insert = db.prepare(
    `INSERT OR REPLACE INTO ${table}(${colList}) VALUES(${columns.map(() => '?').join(',')})`,
  );
  while (true) {
    const where = last === null ? '' : `WHERE ${pk} > ${typeof last === 'string' ? `'${last}'` : last}`;
    const rows = await d1Query(`SELECT ${colList} FROM ${table} ${where} ORDER BY ${pk} LIMIT ${BATCH}`);
    if (!rows.length) break;
    transaction(() => {
      for (const r of rows) insert.run(...columns.map((c) => r[c] ?? null));
    });
    total += rows.length;
    last = rows[rows.length - 1][pk.split(', ')[0]] ?? rows[rows.length - 1][pk];
    if (rows.length < BATCH) break;
  }
  console.log(`restore: ${table} ${total} 行`);
  return total;
}

export async function stageRestore() {
  await pullTable('monsters', 'com2us_id', [
    'com2us_id', 'name', 'unawakened_name', 'family', 'collab', 'element', 'archetype',
    'natural_stars', 'image', 'awaken_bonus', 'leader_skill', 'awakening_chain', 'stats', 'skills',
  ]);
  db.exec('UPDATE monsters SET detail_done = 1, first_seen = COALESCE(first_seen, ?), last_seen = COALESCE(last_seen, ?)', [now(), now()]);

  await pullTable('monster_skills', 'com2us_id, slot', [
    'com2us_id', 'slot', 'name', 'icon', 'level_text', 'description',
    'skillups', 'effects', 'scales_with', 'multiplier',
  ]);
  await pullTable('defenses', 'defense_id', [
    'defense_id', 'monster_leader', 'monster2', 'monster3', 'monster_names',
    'contributor', 'created_at', 'counter_count',
  ]);
  db.exec('UPDATE defenses SET first_seen = COALESCE(first_seen, ?), last_seen = COALESCE(last_seen, ?)', [now(), now()]);
  await pullTable('counters', 'counter_id', [
    'counter_id', 'defense_id', 'monster1', 'monster2', 'monster3',
    'monster_names', 'contributor', 'created_at', 'rating_avg', 'rating_count',
  ]);
  db.exec('UPDATE counters SET first_seen = COALESCE(first_seen, ?), last_seen = COALESCE(last_seen, ?)', [now(), now()]);
  await pullTable('counter_strategies', 'counter_id, strategy_id', [
    'counter_id', 'strategy_id', 'text', 'author', 'created_at', 'votes_up', 'votes_down',
  ]);
  await pullTable('pages', 'path', ['path', 'title', 'text_content', 'fetched_at']);

  // 重建防守队列(全部标记 done,后续 update 流程会只重抓有变化的)
  const enqueue = db.prepare(`
    INSERT INTO defense_queue(defense_key, monster_leader, monster2, monster3, status, counter_hint, discovered_from, enqueued_at, done_at)
    VALUES(?, ?, ?, ?, 'done', ?, 'restore', ?, ?)
    ON CONFLICT(defense_key) DO UPDATE SET status = 'done', counter_hint = excluded.counter_hint
  `);
  const rows = db.prepare('SELECT monster_leader, monster2, monster3, counter_count FROM defenses').all();
  transaction(() => {
    for (const r of rows) {
      enqueue.run(defenseKey([r.monster_leader, r.monster2, r.monster3]),
        r.monster_leader, r.monster2, r.monster3, r.counter_count, now(), now());
    }
  });
  console.log(`restore: 队列重建 ${rows.length} 行(全部 done)`);
}
