// 解析魔灵目录页(/controllers/tools/monsterCatalog) -> 魔灵基本信息列表
import { decodeEntities } from './html.js';

const decodeAttr = (v) => (v != null ? decodeEntities(v) : null);

const ARCHETYPE_MAP = {
  archetypeAttack: 'Attack',
  archetypeDefense: 'Defense',
  archetypeHP: 'HP',
  archetypeSupport: 'Support',
  archetypeMaterial: 'Material',
};

export function parseCatalog(html) {
  const monsters = [];
  const tileRe = /<div class="imageContainer swgt-monster-tile([^"]*)"([^>]*)>/g;
  let m;
  while ((m = tileRe.exec(html)) !== null) {
    const classes = ' ' + m[1];

    const start = m.index;
    const next = html.indexOf('swgt-monster-tile', tileRe.lastIndex);
    const end = next === -1 ? Math.min(start + 20000, html.length) : next;
    const block = html.slice(start, end);

    const idMatch = block.match(/com2usID=(\d+)/);
    if (!idMatch) continue;

    const imgMatch = block.match(/data-src="[^"]*\/monsters36\/([^"/]+)"/);

    const archetype =
      Object.keys(ARCHETYPE_MAP).find((c) => classes.includes(` ${c}`)) ?? null;

    const tags = classes.trim().split(/\s+/).filter(Boolean);

    monsters.push({
      com2us_id: Number(idMatch[1]),
      name: decodeAttr(block.match(/data-monstername="([^"]*)"/)?.[1]),
      unawakened_name: decodeAttr(block.match(/data-monsterunawakenedname="([^"]*)"/)?.[1]),
      element: decodeAttr(block.match(/data-monsterelement="([^"]*)"/)?.[1]),
      natural_stars: Number(block.match(/data-monsternaturalstars="([^"]*)"/)?.[1] ?? 0) || null,
      image: imgMatch ? imgMatch[1] : null,
      archetype: archetype ? ARCHETYPE_MAP[archetype] : null,
      catalog_tags: tags,
    });
  }
  return monsters;
}
