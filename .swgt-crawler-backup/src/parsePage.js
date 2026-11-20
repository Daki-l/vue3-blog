// 通用页面解析:标题 + 正文文本 + 白名单链接发现
import { decodeEntities } from './html.js';
import { PAGE_FOLLOW_PATTERNS } from './config.js';

export function parseGenericPage(html, pagePath) {
  const title = decodeEntities(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').trim();

  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<div id="SWGT_PINNED_MENU"[\s\S]*?<\/ul>\s*<\/div>/i, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  const text = decodeEntities(
    body
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|tr|li|h[1-6]|td|th)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');

  const links = new Set();
  const hrefRe = /href="(\/[^"#]*)"/g;
  let m;
  while ((m = hrefRe.exec(html)) !== null) {
    const p = m[1];
    if (PAGE_FOLLOW_PATTERNS.some((re) => re.test(p))) links.add(p);
  }

  return { title, text: text.slice(0, 200000), links: [...links] };
}
