/**
 * 3v3(3MDC 防守克制)静态数据服务
 * 数据经 /sw/data/3mdc/* 代理(R2 直读+边缘缓存):
 *   manifest.json            总览(热门防守/快照日期)
 *   defense/{a}-{b}-{c}.json 每支防守(key=三魔灵ID升序)含克制+攻略+贝叶斯评分
 *   index/{monsterId}.json   每魔灵参与的防守 key + 克制队伍
 * 展示文案走 i18n;攻略/名称等内容原样展示(不翻译)。
 */
const API = import.meta.env.VITE_API_BASE || 'https://api.linow.us.kg';
const SW_DATA = `${API.replace(/\/+$/, '')}/sw/data/3mdc`;

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) return null; // 静态数据缺失按空处理(如该魔灵无 3v3 记录)
  return res.json();
}

/** 总览(热门防守/总数/快照日期) */
export function fetch3mdcManifest() {
  return getJson(`${SW_DATA}/manifest.json`);
}

/** 防守详情(含按贝叶斯评分排序的克制列表) */
export function fetchDefense(key) {
  return getJson(`${SW_DATA}/defense/${key}.json`);
}

/** 单魔灵 3v3 参战索引 {defenses:[key], counters:[{k,m,n}]} */
export function fetchMonster3mdc(monsterId) {
  return getJson(`${SW_DATA}/index/${monsterId}.json`);
}

/** 由三魔灵 ID 生成防守 key(升序,与导出一致) */
export const defenseKeyOf = (ids) => [...ids].sort((a, b) => a - b).join('-');
