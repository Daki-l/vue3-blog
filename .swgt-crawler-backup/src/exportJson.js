// 从 SQLite 导出 JSON 快照到 data/export/
import { mkdirSync, writeFileSync } from 'node:fs';
import { db } from './db.js';
import { EXPORT_DIR } from './config.js';
import { CDN_BASE } from './images.js';

const J = (s) => JSON.parse(s ?? 'null');
const cdnUrl = (dir, file) => (file ? `${CDN_BASE}/${dir}/${file}` : null);

function writeJson(name, data) {
  const file = `${EXPORT_DIR}/${name}`;
  writeFileSync(file, JSON.stringify(data));
  console.log(`export: ${name} (${data.length} 条, ${(JSON.stringify(data).length / 1024 / 1024).toFixed(2)} MB)`);
}

export function runExport() {
  mkdirSync(EXPORT_DIR, { recursive: true });

  const monsters = db.prepare(`
    SELECT m.com2us_id, m.name, m.unawakened_name, m.family, m.collab, m.element,
           m.archetype, m.natural_stars, m.image, m.awaken_bonus, m.leader_skill,
           m.awakening_chain, m.stats, m.skills, m.extra
    FROM monsters m ORDER BY m.com2us_id
  `).all().map((r) => ({
    ...r,
    leader_skill: J(r.leader_skill),
    awakening_chain: J(r.awakening_chain),
    stats: J(r.stats),
    skills: J(r.skills),
    extra: J(r.extra),
  }));
  writeJson('monsters.json', monsters.map((m) => ({
    ...m,
    image_url: cdnUrl('monsters36', m.image),
    image_url_large: cdnUrl('monsters', m.image),
  })));

  writeJson('monsters_min.json', monsters.map((m) => ({
    id: m.com2us_id, name: m.name, element: m.element, archetype: m.archetype,
    family: m.family, stars: m.natural_stars, image: m.image,
    image_url: cdnUrl('monsters36', m.image),
  })));

  const defenses = db.prepare('SELECT * FROM defenses ORDER BY defense_id').all();
  const countersByDefense = new Map();
  for (const c of db.prepare('SELECT * FROM counters ORDER BY defense_id, counter_id').all()) {
    const strategies = db.prepare(
      'SELECT text, author, created_at, votes_up, votes_down FROM counter_strategies WHERE counter_id = ? ORDER BY strategy_id',
    ).all(c.counter_id);
    if (!countersByDefense.has(c.defense_id)) countersByDefense.set(c.defense_id, []);
    countersByDefense.get(c.defense_id).push({ ...c, strategies });
  }
  writeJson('defenses.json', defenses.map((d) => ({
    ...d,
    counters: countersByDefense.get(d.defense_id) ?? [],
  })));

  const pages = db.prepare('SELECT path, title, text_content, fetched_at FROM pages ORDER BY path').all();
  writeJson('pages.json', pages);

  const manifest = {
    generated_at: new Date().toISOString(),
    source: 'https://swgt.io',
    counts: {
      monsters: monsters.length,
      defenses: defenses.length,
      counters: [...countersByDefense.values()].reduce((a, b) => a + b.length, 0),
      strategies: db.prepare('SELECT COUNT(*) c FROM counter_strategies').get().c,
      pages: pages.length,
    },
  };
  writeFileSync(`${EXPORT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log('export: manifest.json 写入完成');
  return manifest;
}
