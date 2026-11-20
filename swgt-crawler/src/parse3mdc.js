// 解析 3MDC 防守详情页(/3mdc/?monsterLeader=A&monster2=B&monster3=C)
import { toText, toLine, parseSwgtShortDate } from './html.js';

function parseCards(html, defenseId) {
  const counters = [];
  const starts = [...html.matchAll(/<div class="swgt-3mdc-card/g)].map((m) => m.index);
  for (let i = 0; i < starts.length; i++) {
    const block = html.slice(starts[i], starts[i + 1] ?? html.length);
    const ids = [...block.matchAll(/com2usID=(\d+)/g)].map((m) => Number(m[1]));
    if (ids.length < 3) continue;
    const title = toLine(block.match(/swgt-3mdc-title">([^<]*)/)?.[1] ?? '');
    const metaText = toText(block.match(/swgt-3mdc-created">([\s\S]*?)<\/span>/)?.[1] ?? '');
    const contributor = metaText.match(/By:\s*(.+?)\s*on\s/i)?.[1]?.trim() ?? null;
    const createdOn = parseSwgtShortDate(metaText);
    const counterId = Number(block.match(/DIV_TAG_\d+_(\d+)/)?.[1] ?? 0) || null;

    let ratingAvg = null;
    let ratingCount = null;
    if (defenseId && counterId) {
      const m = html.match(
        new RegExp(
          `id="DIV_${defenseId}_${counterId}"[\\s\\S]{0,1200}?ratingScoreValue">([\\d.]+)<[\\s\\S]{0,300}?ratingCount">\\s*(\\d+)\\s+User`,
        ),
      );
      if (m) {
        ratingAvg = Number(m[1]) || null;
        ratingCount = Number(m[2]) || null;
      }
    }

    counters.push({
      counter_id: counterId,
      monster_ids: ids.slice(0, 3),
      monster_names: title || null,
      contributor,
      created_at: createdOn,
      rating_avg: ratingAvg,
      rating_count: ratingCount,
    });
  }
  return counters;
}

function parseStrategies(html) {
  const out = new Map();
  const detRe = /<div id="DETAILS_(\d+)" class="collapse swgt-3mdc-details">/g;
  const marks = [...html.matchAll(detRe)];
  for (let i = 0; i < marks.length; i++) {
    const counterId = Number(marks[i][1]);
    const block = html.slice(marks[i].index, marks[i + 1]?.index ?? html.length);

    const strategies = [];
    for (const sb of block.split('swgt-3mdc-strategy-block').slice(1)) {
      const text = toText(sb.match(/swgt-3mdc-strategy-text">([\s\S]*?)<\/div>/)?.[1] ?? '');
      if (!text) continue;
      const metaText = toText(sb.match(/swgt-3mdc-strategy-meta">([\s\S]*?)<\/div>/)?.[1] ?? '');
      const author = metaText.match(/By:\s*(.+?)\s*on\s/i)?.[1]?.trim() ?? null;
      const createdOn = parseSwgtShortDate(metaText);

      const votesDiv = sb.match(/id="DIV_(\d+)_\d+_\d+"[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? sb;
      const up = Number(votesDiv.match(/btn-3mdc-thumbsUp[^>]*>\s*(-?\d+)\s*</)?.[1] ?? 0) || 0;
      const down = Number(votesDiv.match(/btn-3mdc-thumbsDown[^>]*>\s*(-?\d+)\s*</)?.[1] ?? 0) || 0;
      const strategyId = Number(votesDiv.match(/id="DIV_(\d+)_\d+_\d+"/)?.[1] ?? 0) || null;

      strategies.push({
        strategy_id: strategyId,
        text,
        author,
        created_at: createdOn,
        votes_up: up,
        votes_down: down,
      });
    }
    if (strategies.length) out.set(counterId, strategies);
  }
  return out;
}

export function parseDefenseDetail(html) {
  const defenseId = Number(html.match(/DIV_TAG_(\d+)_\d+/)?.[1] ?? 0) || null;
  const counters = parseCards(html, defenseId);
  const strategiesByCounter = parseStrategies(html);
  for (const c of counters) {
    c.strategies = strategiesByCounter.get(c.counter_id) ?? [];
  }
  return { defense_id: defenseId, counters };
}
