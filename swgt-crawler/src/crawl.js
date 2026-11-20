// 爬取编排:catalog / monsters / defenses / pages 各阶段,支持断点续跑与增量刷新
import { createHash } from 'node:crypto';
import { fetchHtml, httpStats } from './http.js';
import {
  db, now, transaction, startRun, finishRun, setMeta, getMeta,
} from './db.js';
import {
  CATALOG_URL, monsterDetailPath, defenseDetailPath, PAGE_SEEDS, PAGE_MAX,
  DEFENSE_CONCURRENCY,
} from './config.js';
import { parseCatalog } from './parseCatalog.js';
import { parseMonsterDetail } from './parseMonster.js';
import { parseDefenseDetail } from './parse3mdc.js';
import { parseGenericPage } from './parsePage.js';

const J = (v) => JSON.stringify(v ?? null);

function log(...args) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...args);
}

export function defenseKey(ids) {
  return [...ids].sort((a, b) => a - b).join('-');
}

/** 阶段 1:魔灵目录 -> monsters 基础信息 */
export async function stageCatalog(opts = {}) {
  const runId = startRun('catalog');
  const { html } = await fetchHtml(CATALOG_URL, { fresh: opts.fresh });
  const monsters = parseCatalog(html);
  log(`catalog: 解析到 ${monsters.length} 只魔灵`);

  const upsert = db.prepare(`
    INSERT INTO monsters(com2us_id, name, unawakened_name, family, element, archetype,
                         natural_stars, image, extra, first_seen, last_seen)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(com2us_id) DO UPDATE SET
      name = excluded.name, unawakened_name = excluded.unawakened_name,
      element = excluded.element, archetype = excluded.archetype,
      natural_stars = excluded.natural_stars, image = excluded.image,
      extra = excluded.extra, last_seen = excluded.last_seen
  `);
  transaction(() => {
    for (const m of monsters) {
      upsert.run(
        m.com2us_id, m.name, m.unawakened_name, null, m.element, m.archetype,
        m.natural_stars, m.image, J({ catalog_tags: m.catalog_tags }), now(), now(),
      );
    }
  });
  setMeta('catalog_count', monsters.length);
  setMeta('catalog_done_at', now());
  finishRun(runId, monsters.length, 0, `${monsters.length} monsters`);
  return monsters.length;
}

/**
 * 阶段 2:魔灵详情页 -> 完整档案 + 技能 + 3MDC 防守发现
 * opts.refresh = true 时全量重抓(增量更新的发现层):
 *   - 刷新魔灵档案(属性/技能随平衡补丁变化)
 *   - 用页面上的 "N COUNTERS" 提示与库内 counter_count 比对,
 *     克制数有变化的防守重置为 pending,只重抓变化的防守
 */
export async function stageMonsters(opts = {}) {
  const runId = startRun('monsters');
  const where = opts.fresh || opts.refresh ? '' : 'WHERE detail_done = 0';
  const rows = db.prepare(`SELECT com2us_id FROM monsters ${where} ORDER BY com2us_id`).all();
  let todo = rows.map((r) => r.com2us_id);
  if (opts.limit) todo = todo.slice(0, opts.limit);
  log(`monsters: 待抓取 ${todo.length} 个详情页 (refresh=${!!opts.refresh})`);

  const enqueue = db.prepare(`
    INSERT INTO defense_queue(defense_key, monster_leader, monster2, monster3,
                              counter_hint, discovered_from, enqueued_at)
    VALUES(?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(defense_key) DO UPDATE SET
      monster_leader = COALESCE(excluded.monster_leader, defense_queue.monster_leader),
      monster2 = COALESCE(excluded.monster2, defense_queue.monster2),
      monster3 = COALESCE(excluded.monster3, defense_queue.monster3),
      counter_hint = COALESCE(excluded.counter_hint, defense_queue.counter_hint)
  `);
  // 增量核心:已完成的防守,若页面提示的克制数 != 库内计数,则重置为待抓
  const resetIfChanged = db.prepare(`
    UPDATE defense_queue SET status = 'pending', last_error = NULL
    WHERE defense_key = ? AND status IN ('done','missing') AND counter_hint IS NOT NULL
      AND counter_hint != COALESCE((
        SELECT counter_count FROM defenses
        WHERE monster_leader = defense_queue.monster_leader
          AND monster2 = defense_queue.monster2
          AND monster3 = defense_queue.monster3
      ), -1)
  `);

  const saveMonster = db.prepare(`
    UPDATE monsters SET
      name = ?, element = ?, archetype = ?, family = ?,
      natural_stars = ?, awaken_bonus = ?, awakening_chain = ?,
      stats = ?, skills = ?, leader_skill = ?,
      detail_done = 1, last_seen = ?, content_hash = ?
    WHERE com2us_id = ?
  `);
  const clearSkills = db.prepare('DELETE FROM monster_skills WHERE com2us_id = ?');
  const insertSkill = db.prepare(`
    INSERT INTO monster_skills(com2us_id, slot, name, icon, level_text, description,
                               skillups, effects, scales_with, multiplier)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let ok = 0;
  let err = 0;
  let requeued = 0;
  for (const id of todo) {
    try {
      const { html } = await fetchHtml(monsterDetailPath(id), { fresh: opts.fresh || opts.refresh });
      const { profile, threemdc } = parseMonsterDetail(html);

      const contentHash = createHash('sha1')
        .update(JSON.stringify(profile)).digest('hex').slice(0, 16);

      const touched = [];
      transaction(() => {
        saveMonster.run(
          profile.name, profile.element, profile.archetype, profile.family,
          profile.natural_stars, profile.awaken_bonus, J(profile.awakening_chain),
          J(profile.stats), J(profile.skills), J(profile.leader_skill),
          now(), contentHash, id,
        );
        clearSkills.run(id);
        for (const s of profile.skills) {
          insertSkill.run(
            id, s.slot, s.name, s.icon, s.level_text, s.description,
            J(s.skillups), J(s.effects), J(s.scales_with), s.multiplier,
          );
        }
        for (const d of threemdc.defenses) {
          if (d.details?.length === 3) {
            const key = defenseKey(d.details);
            enqueue.run(key, d.details[0], d.details[1], d.details[2], d.counter_hint,
              `monster:${id}`, now());
            touched.push(key);
          }
        }
        for (const c of threemdc.countersOf) {
          const key = defenseKey(c.defense_ids);
          enqueue.run(key, c.defense_ids[0], c.defense_ids[1], c.defense_ids[2], c.counter_hint,
            `monster-counter:${id}`, now());
          touched.push(key);
        }
      });
      if (opts.refresh) {
        transaction(() => {
          for (const key of touched) {
            const r = resetIfChanged.run(key);
            requeued += Number(r.changes);
          }
        });
      }
      ok++;
      if (ok % 50 === 0) {
        log(`monsters: ${ok}/${todo.length} 完成 (fetch=${httpStats.fetched} 重排队列=${requeued})`);
      }
    } catch (e) {
      err++;
      log(`monsters: ERROR id=${id}: ${e.message}`);
    }
  }
  const q = db.prepare("SELECT COUNT(*) c FROM defense_queue WHERE status='pending'").get();
  log(`monsters: 完成 ok=${ok} err=${err}; 变化重排 ${requeued}; 防守队列待处理 ${q.c}`);
  finishRun(runId, ok, err, `requeued=${requeued} pending=${q.c}`);
  return { ok, err, requeued };
}

/** 阶段 3:逐个防守详情页 -> 克制队伍 + 评分 + 攻略(并发池) */
export async function stageDefenses(opts = {}) {
  const runId = startRun('defenses');
  let rows = db.prepare(
    "SELECT * FROM defense_queue WHERE status IN ('pending', 'error') ORDER BY enqueued_at",
  ).all();
  if (opts.limit) rows = rows.slice(0, opts.limit);
  log(`defenses: 待抓取 ${rows.length} 个防守详情页 (并发 ${DEFENSE_CONCURRENCY})`);

  const upsertDefense = db.prepare(`
    INSERT INTO defenses(defense_id, monster_leader, monster2, monster3, monster_names,
                         contributor, created_at, counter_count, first_seen, last_seen)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(defense_id) DO UPDATE SET
      counter_count = excluded.counter_count, last_seen = excluded.last_seen
  `);
  const upsertCounter = db.prepare(`
    INSERT INTO counters(counter_id, defense_id, monster1, monster2, monster3,
                         monster_names, contributor, created_at, rating_avg, rating_count,
                         first_seen, last_seen)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(counter_id) DO UPDATE SET
      rating_avg = excluded.rating_avg, rating_count = excluded.rating_count,
      monster_names = excluded.monster_names, last_seen = excluded.last_seen
  `);
  const upsertStrategy = db.prepare(`
    INSERT INTO counter_strategies(strategy_id, counter_id, text, author, created_at,
                                   votes_up, votes_down)
    VALUES(?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(counter_id, strategy_id) DO UPDATE SET
      text = excluded.text, author = excluded.author, created_at = excluded.created_at,
      votes_up = excluded.votes_up, votes_down = excluded.votes_down
  `);
  const markQueue = db.prepare(
    "UPDATE defense_queue SET status = ?, tries = tries + 1, last_error = ?, done_at = ? WHERE defense_key = ?",
  );

  let ok = 0;
  let err = 0;
  let idx = 0;

  const worker = async () => {
    while (idx < rows.length) {
      const q = rows[idx++];
      const path = defenseDetailPath(q.monster_leader, q.monster2, q.monster3);
      try {
        const { html } = await fetchHtml(path, { fresh: opts.fresh });
        const { defense_id, counters } = parseDefenseDetail(html);
        if (!defense_id) {
          markQueue.run('missing', 'defense not on site', now(), q.defense_key);
          continue;
        }

        const names = (ids) => ids
          .map((x) => html.match(new RegExp(`com2usID=${x}"[\\s\\S]{0,200}?title="([^"]*)"`))?.[1])
          .filter(Boolean)
          .join(' ');

        transaction(() => {
          upsertDefense.run(
            defense_id, q.monster_leader, q.monster2, q.monster3,
            names([q.monster_leader, q.monster2, q.monster3]),
            null, null, counters.length, now(), now(),
          );
          for (const c of counters) {
            if (!c.counter_id) continue;
            upsertCounter.run(
              c.counter_id, defense_id, ...c.monster_ids,
              c.monster_names ?? names(c.monster_ids),
              c.contributor, c.created_at, c.rating_avg, c.rating_count, now(), now(),
            );
            for (const s of c.strategies) {
              if (!s.strategy_id) continue;
              upsertStrategy.run(
                s.strategy_id, c.counter_id, s.text, s.author, s.created_at,
                s.votes_up, s.votes_down,
              );
            }
          }
          markQueue.run('done', null, now(), q.defense_key);
        });
        ok++;
      } catch (e) {
        err++;
        markQueue.run('error', e.message.slice(0, 500), null, q.defense_key);
        log(`defenses: ERROR ${q.defense_key}: ${e.message}`);
      }
      const done = ok + err;
      if (done % 100 === 0) {
        log(`defenses: ${done}/${rows.length} 完成 (fetch=${httpStats.fetched})`);
      }
    }
  };
  await Promise.all(Array.from({ length: DEFENSE_CONCURRENCY }, () => worker()));

  log(`defenses: 完成 ok=${ok} err=${err}`);
  finishRun(runId, ok, err, '');
  return { ok, err };
}

/** 维护阶段:用本地缓存重建防守队列(不发网络请求) */
export async function stageRediscover() {
  const runId = startRun('rediscover');
  const rows = db.prepare('SELECT com2us_id FROM monsters ORDER BY com2us_id').all();
  db.exec("DELETE FROM defense_queue WHERE status != 'done'");
  log(`rediscover: 清空未完成队列,重新扫描 ${rows.length} 个已缓存魔灵页`);

  const enqueue = db.prepare(`
    INSERT INTO defense_queue(defense_key, monster_leader, monster2, monster3, counter_hint, discovered_from, enqueued_at)
    VALUES(?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(defense_key) DO UPDATE SET
      monster_leader = excluded.monster_leader,
      monster2 = excluded.monster2,
      monster3 = excluded.monster3,
      status = 'pending', last_error = NULL
  `);

  let scanned = 0;
  let missing = 0;
  for (const { com2us_id: id } of rows) {
    const { html, fromCache } = await fetchHtml(monsterDetailPath(id), { useCache: true, fresh: false });
    if (!fromCache) missing++;
    const { threemdc } = parseMonsterDetail(html);
    transaction(() => {
      for (const d of threemdc.defenses) {
        if (d.details?.length === 3) {
          enqueue.run(defenseKey(d.details), d.details[0], d.details[1], d.details[2],
            d.counter_hint, `monster:${id}`, now());
        }
      }
      for (const c of threemdc.countersOf) {
        enqueue.run(defenseKey(c.defense_ids), c.defense_ids[0], c.defense_ids[1],
          c.defense_ids[2], c.counter_hint, `monster-counter:${id}`, now());
      }
    });
    scanned++;
    if (scanned % 200 === 0) log(`rediscover: ${scanned}/${rows.length}`);
  }
  const q = db.prepare("SELECT status, COUNT(*) c FROM defense_queue GROUP BY status").all();
  log(`rediscover: 完成 扫描=${scanned} 网络请求=${missing} 队列=${JSON.stringify(q)}`);
  finishRun(runId, scanned, 0, JSON.stringify(q));
  return { scanned, missing };
}

/** 阶段 4:通用公开页面存档 */
export async function stagePages(opts = {}) {
  const runId = startRun('pages');
  const archived = db.prepare('SELECT path, links_found FROM pages').all();
  const visited = new Set(archived.map((r) => r.path));
  // 种子 = 配置种子 + 已入库页面曾发现过的链接(进程重启后 BFS 队列不丢)
  const queue = [];
  for (const p of PAGE_SEEDS) if (!visited.has(p) && !queue.includes(p)) queue.push(p);
  if (!opts.fresh) {
    for (const r of archived) {
      let links = [];
      try { links = JSON.parse(r.links_found ?? '[]'); } catch { /* 忽略损坏行 */ }
      for (const l of links) if (!visited.has(l) && !queue.includes(l)) queue.push(l);
    }
  } else {
    visited.clear();
  }
  const maxPages = opts.limit ?? PAGE_MAX;

  const upsertPage = db.prepare(`
    INSERT INTO pages(path, title, text_content, links_found, fetched_at)
    VALUES(?, ?, ?, ?, ?)
    ON CONFLICT(path) DO UPDATE SET
      title = excluded.title, text_content = excluded.text_content,
      links_found = excluded.links_found, fetched_at = excluded.fetched_at
  `);

  let ok = 0;
  let err = 0;
  while (queue.length && ok < maxPages) {
    const p = queue.shift();
    if (visited.has(p)) continue;
    visited.add(p);
    try {
      const { html, status, finalUrl } = await fetchHtml(p, { fresh: opts.fresh });
      if (status === 404 || /login\.jsp|\/login/i.test(finalUrl ?? '')) {
        log(`pages: 跳过 ${p} (status=${status} final=${finalUrl})`);
        continue;
      }
      const { title, text, links } = parseGenericPage(html, p);
      upsertPage.run(p, title, text, J(links), now());
      ok++;
      for (const l of links) if (!visited.has(l) && !queue.includes(l)) queue.push(l);
      if (ok % 25 === 0) log(`pages: ${ok} 已存档, 队列剩 ${queue.length}`);
    } catch (e) {
      err++;
      log(`pages: ERROR ${p}: ${e.message}`);
    }
  }
  log(`pages: 完成 ok=${ok} err=${err}, 剩余队列 ${queue.length}`);
  finishRun(runId, ok, err, `remaining=${queue.length}`);
  return { ok, err };
}

export function stageStats() {
  const one = (sql) => db.prepare(sql).get().c;
  return {
    monsters: one('SELECT COUNT(*) c FROM monsters'),
    monsters_detailed: one('SELECT COUNT(*) c FROM monsters WHERE detail_done = 1'),
    skills: one('SELECT COUNT(*) c FROM monster_skills'),
    defense_queue_pending: one("SELECT COUNT(*) c FROM defense_queue WHERE status = 'pending'"),
    defense_queue_done: one("SELECT COUNT(*) c FROM defense_queue WHERE status = 'done'"),
    defenses: one('SELECT COUNT(*) c FROM defenses'),
    counters: one('SELECT COUNT(*) c FROM counters'),
    strategies: one('SELECT COUNT(*) c FROM counter_strategies'),
    pages: one('SELECT COUNT(*) c FROM pages'),
    catalog_done_at: getMeta('catalog_done_at'),
  };
}
