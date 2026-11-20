// 解析魔灵详情页(/monsterSearch/?com2usID=xxx)
import { toText, toLine, parseStatValue, parseSortTimestamp } from './html.js';

function parseStats(html) {
  const stats = {};
  const chunks = html.split('monster-stat-row monster-stat-row--').slice(1);
  for (const chunk of chunks) {
    const key = chunk.match(/^([\w-]+)/)?.[1];
    if (!key) continue;
    const value = chunk.match(/monster-stat-value">([^<]*)/)?.[1];
    const min = chunk.match(/<span>(Min[^<]*)<\/span>/)?.[1];
    const max = chunk.match(/<span>(Max[^<]*)<\/span>/)?.[1];
    if (value == null) continue;
    const v = parseStatValue(value);
    stats[key] = {
      ...v,
      ...(min != null ? { min: parseStatValue(min).value } : {}),
      ...(max != null ? { max: parseStatValue(max).value } : {}),
    };
  }
  return stats;
}

function parseLeaderSkill(html) {
  const block = html.match(
    /<div class="monster-leader-skill-card">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  )?.[0];
  if (!block) return null;
  const icon = block.match(/monster-leader-skill-icon" src="[^"]*\/([^"/]+)"/)?.[1] ?? null;
  const text = toText(
    block.match(/monster-leader-skill-description">([\s\S]*?)<\/div>/)?.[1] ?? '',
  );
  if (!text || /^none$/i.test(text)) return null;
  return { icon, text };
}

function parseSkills(html) {
  const skills = [];
  const chunks = html.split('<div class="monster-skill-card').slice(1);
  for (const chunk of chunks) {
    const name = toLine(chunk.match(/monster-skill-name">([\s\S]*?)<\/div>/)?.[1] ?? '');
    if (!name) continue;

    const icon = chunk.match(/monster-skill-icon" src="[^"]*\/([^"/]+)"/)?.[1] ?? null;
    const levelText = toLine(chunk.match(/monster-skill-level">([^<]*)/)?.[1] ?? '') || null;
    const description = toText(
      chunk.match(/monster-skill-description">([\s\S]*?)<\/div>/)?.[1] ?? '',
    );

    const skillups = [];
    const upRe = /monster-skillup-number">(\d+)<\/span>\s*<span class="monster-skillup-text">([^<]*)/g;
    let um;
    while ((um = upRe.exec(chunk)) !== null) {
      skillups.push({ n: Number(um[1]), text: toLine(um[2]) });
    }

    const effects = [];
    const pillRe = /swgt-skill-effect-pill[^>]*>\s*([^<\n]+)/g;
    let pm;
    while ((pm = pillRe.exec(chunk)) !== null) {
      const t = toLine(pm[1]);
      if (t && t !== '-') effects.push(t);
    }
    const effImgRe = /swgt-skill-effect-image" title="([^"]*)"/g;
    let em;
    while ((em = effImgRe.exec(chunk)) !== null) effects.push(toLine(em[1]));

    const scalesWith = toLine(
      chunk.match(
        /monster-skill-section-label">Scales With<\/div>\s*<div class="monster-skill-meta-value">\s*(?:<span>)?([^<]*)/,
      )?.[1] ?? '',
    );
    const multiplier = toLine(
      chunk.match(
        /monster-skill-formula-value">\s*(?:<span>)?([^<]*)/,
      )?.[1] ?? '',
    );

    skills.push({
      slot: skills.length + 1,
      name,
      icon,
      level_text: levelText,
      description,
      skillups,
      effects: [...new Set(effects)],
      scales_with: scalesWith ? scalesWith.split(/\s+and\s+|,/i).map((s) => s.trim()).filter(Boolean) : [],
      multiplier: multiplier || null,
    });
  }
  return skills;
}

/** 解析魔灵页内嵌的两个 3MDC 表 */
function parseDefenseTables(html) {
  const extract = (tableId) => {
    const start = html.indexOf(`<table id="${tableId}"`);
    if (start === -1) return [];
    const end = html.indexOf('</tbody>', start);
    const tbody = html.slice(start, end);
    const rows = [];
    for (const tr of tbody.split('<tr').slice(1)) {
      const tds = tr.split('<td');
      if (tds.length < 2) continue;
      const teamIds = (tds[1].match(/com2usID=(\d+)/g) ?? []).map((s) => Number(s.slice(9)));
      if (teamIds.length === 0) continue;

      const details = tr.match(/monsterLeader=(\d+)&amp;monster2=(\d+)&amp;monster3=(\d+)/);
      const otherIds = [];
      if (tds.length >= 3) {
        otherIds.push(...(tds[2].match(/com2usID=(\d+)/g) ?? []).map((s) => Number(s.slice(9))));
      }

      let createdAt = null;
      let contributor = null;
      const createdTd = tds.find((td) => /data-sort="\d{12}"/.test(td));
      if (createdTd) {
        createdAt = parseSortTimestamp(createdTd.match(/data-sort="(\d{12})"/)?.[1]);
        const lines = toText(createdTd).split('\n');
        contributor = lines.length > 1 ? lines[lines.length - 1] : null;
      }

      // "16 COUNTERS" 链接文本 -> 该防守当前克制数(增量更新的变化信号)
      const counterHint = Number(tr.match(/>\s*(\d+)\s+COUNTERS\s*</i)?.[1] ?? 0) || null;

      rows.push({ teamIds, otherIds, details, createdAt, contributor, counterHint });
    }
    return rows;
  };

  const defenses = [];
  for (const r of extract('TABLE_threeMonsterDefenses')) {
    defenses.push({
      monster_ids: r.teamIds,
      contributor: r.contributor,
      created_at: r.createdAt,
      counter_hint: r.counterHint,
      details: r.details
        ? [Number(r.details[1]), Number(r.details[2]), Number(r.details[3])]
        : [...r.teamIds],
    });
  }

  const countersOf = [];
  for (const r of extract('TABLE_threeMonsterDefensesCounters')) {
    const defIds = r.details
      ? [Number(r.details[1]), Number(r.details[2]), Number(r.details[3])]
      : r.otherIds.slice(0, 3);
    if (r.teamIds.length >= 3 && defIds.length >= 3) {
      countersOf.push({
        counter_ids: r.teamIds.slice(0, 3),
        defense_ids: defIds,
        counter_hint: r.counterHint,
      });
    }
  }

  return { defenses, countersOf };
}

export function parseMonsterDetail(html) {
  const name = toLine(html.match(/monster-profile-name">([^<]*)/)?.[1] ?? '');

  const metaRow = (label) => {
    const re = new RegExp(`monster-profile-meta-label">[\\s\\S]*?${label}\\s*</span>\\s*<span class="monster-profile-meta-value">([\\s\\S]*?)</span>`);
    return toLine(html.match(re)?.[1] ?? '');
  };

  const naturalStars = (html.match(/monster-profile-natural-stars[\s\S]*?<\/span>/)?.[0] ?? '')
    .split('fa-star').length - 1 || null;

  const awakenBonus = toLine(
    html.match(/section-title">Awaken Bonus<\/div>\s*<div class="monster-profile-section-text">([^<]*)/)?.[1] ?? '',
  ) || null;

  const awakeningChain = [
    ...html.matchAll(/href="\/monsterSearch\/\?com2usID=(\d+)"[^>]*class="monster-awakening-link"/g),
  ].map((m) => Number(m[1]));

  const skillupTotal = Number(
    toLine(html.match(/monster-stat-row--skillups[\s\S]*?monster-stat-value">([^<]*)/)?.[1] ?? '').replace(/[^0-9]/g, ''),
  ) || null;

  return {
    profile: {
      name: name || null,
      element: metaRow('Element') || null,
      archetype: metaRow('Archetype') || null,
      family: metaRow('Family') || null,
      natural_stars: naturalStars,
      awaken_bonus: awakenBonus,
      awakening_chain: awakeningChain,
      skillup_total: skillupTotal,
      stats: parseStats(html),
      leader_skill: parseLeaderSkill(html),
      skills: parseSkills(html),
    },
    threemdc: parseDefenseTables(html),
  };
}
