// 轻量 HTML 工具:实体解码/去标签/文本提取(零依赖)

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  iexcl: '¡', cent: '¢', pound: '£', curren: '¤', yen: '¥', sect: '§',
  uml: '¨', copy: '©', ordf: 'ª', laquo: '«', not: '¬', reg: '®', macr: '¯',
  deg: '°', plusmn: '±', sup2: '²', sup3: '³', acute: '´', micro: 'µ',
  para: '¶', middot: '·', cedil: '¸', sup1: '¹', ordm: 'º', raquo: '»',
  frac14: '¼', frac12: '½', frac34: '¾', iquest: '¿', times: '×', divide: '÷',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Auml: 'Ä', Aring: 'Å',
  AElig: 'Æ', Ccedil: 'Ç', Egrave: 'È', Eacute: 'É', Ecirc: 'Ê', Euml: 'Ë',
  Igrave: 'Ì', Iacute: 'Í', Icirc: 'Î', Iuml: 'Ï', ETH: 'Ð', Ntilde: 'Ñ',
  Ograve: 'Ò', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Ouml: 'Ö', Oslash: 'Ø',
  Ugrave: 'Ù', Uacute: 'Ú', Ucirc: 'Û', Uummml: 'Ü', Yacute: 'Ý', THORN: 'Þ',
  szlig: 'ß', agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä',
  aring: 'å', aelig: 'æ', ccedil: 'ç', egrave: 'è', eacute: 'é', ecirc: 'ê',
  euml: 'ë', igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï', eth: 'ð',
  ntilde: 'ñ', ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö',
  oslash: 'ø', ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü', yacute: 'ý',
  thorn: 'þ', yuml: 'ÿ', OElig: 'Œ', oelig: 'œ', Scaron: 'Š', scaron: 'š',
  Yuml: '\u0178', fnof: '\u0192', circ: '\u02C6', tilde: '\u02DC', hellip: '\u2026', mdash: '\u2014',
  ndash: '\u2013', lsquo: '\u2018', rsquo: '\u2019', sbquo: '\u201A', ldquo: '\u201C', rdquo: '\u201D',
  bdquo: '\u201E', dagger: '\u2020', Dagger: '\u2021', bull: '\u2022', permil: '\u2030',
  lsaquo: '‹', rsaquo: '›', euro: '€', trade: '™', rarr: '→', larr: '←',
  uarr: '↑', darr: '↓', harr: '↔', ne: '≠', le: '≤', ge: '≥', minus: '−',
};

export function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}

export function stripTags(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '');
}

/** 压缩空白并解码实体,得到可读文本 */
export function toText(html) {
  return decodeEntities(stripTags(html))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

/** 单行文本(用于名称/数值等) */
export function toLine(html) {
  return decodeEntities(stripTags(html)).replace(/\s+/g, ' ').trim();
}

/** 取属性值(html 片段内第一个匹配) */
export function attr(block, name) {
  const m = String(block).match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`));
  return m ? decodeEntities(m[1]) : null;
}

/** 解析 "12,015" / "30%" / "101" -> {value, isPercent} */
export function parseStatValue(raw) {
  const s = String(raw ?? '').trim();
  const isPercent = s.includes('%');
  const n = Number(s.replace(/[^0-9.\-]/g, ''));
  return { value: Number.isFinite(n) ? n : null, isPercent };
}

/** "MM/DD/YYYY"(仅日期) -> "YYYY-MM-DD" */
export function parseSwgtShortDate(s) {
  const m = String(s ?? '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[1]}-${m[2]}` : null;
}

/** data-sort="202104221145" -> "2021-04-22T11:45:00Z" */
export function parseSortTimestamp(s) {
  const m = String(s ?? '').match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00Z` : null;
}
