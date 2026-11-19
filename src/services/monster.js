/**
 * 魔灵图鉴数据服务
 * 数据全部静态化在 R2(static.linow.us.kg/sw/),读路径零 Worker/零 D1:
 *   列表: /sw/data/monsters_min.json(全量精简,前端内存筛选)
 *   详情: /sw/data/monster/{com2us_id}.json(按需单只)
 * 图片仅存文件名,由此处统一拼自家 CDN 链接(不再引用上游 CloudFront)。
 * 中文预留:详情数据未来可含 zh 覆盖层,经 pick() 做 zh||en 合并。
 */

const STATIC = import.meta.env.VITE_STATIC_BASE || 'https://static.linow.us.kg';
export const SW_BASE = `${STATIC}/sw`;

export const monsterImg = (file, large = false) => `${SW_BASE}/${large ? 'monsters' : 'monsters36'}/${file}`;
export const skillIconUrl = (file) => `${SW_BASE}/skills/${file}`;
// 上游仅引用 36px 队长/效果图标(无全尺寸目录),沿用小图
export const leaderIconUrl = (file) => `${SW_BASE}/leader_skills36/${file}`;

/** zh||en 字段合并(中文化预留,当前数据无 zh 自然回退英文) */
export const pick = (zh, en) => (zh && String(zh).trim() ? zh : en);

async function getJson(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

/** 全量精简列表(945 条,一次拉取后内存筛选) */
export function fetchMonsterList() {
	return getJson(`${SW_BASE}/data/monsters_min.json`);
}

/** 单只魔灵详情 */
export function fetchMonster(id) {
	return getJson(`${SW_BASE}/data/monster/${id}.json`);
}

/** 元素/定位枚举(展示层中文,数据值英文) */
export const ELEMENTS = [
	{ value: 'Water', label: '水', color: '#4a90d9' },
	{ value: 'Fire', label: '火', color: '#e2593f' },
	{ value: 'Wind', label: '风', color: '#8fbf3f' },
	{ value: 'Light', label: '光', color: '#d9a521' },
	{ value: 'Dark', label: '暗', color: '#8e6fbf' }
];

export const ARCHETYPES = [
	{ value: 'Attack', label: '攻击' },
	{ value: 'Defense', label: '防御' },
	{ value: 'HP', label: '体力' },
	{ value: 'Support', label: '辅助' },
	{ value: 'Material', label: '材料' }
];

export const elementMeta = (v) => ELEMENTS.find((e) => e.value === v) || { label: v, color: '#909399' };
export const archetypeLabel = (v) => ARCHETYPES.find((a) => a.value === v)?.label || v;

/** 属性中文名(详情页属性行) */
export const STAT_LABELS = {
	hp: '体力', atk: '攻击', def: '防御', spd: '速度',
	cr: '暴击率', cd: '暴击伤害', res: '抵抗', acc: '命中', skillups: '强化次数'
};
