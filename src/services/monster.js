/**
 * 魔灵图鉴数据服务
 * 数据 JSON 经 api.linow.us.kg/sw/data/* 代理(Worker R2 直读+边缘缓存,带 CORS);
 * 图片直连 static.linow.us.kg/sw/(img 标签无 CORS 限制),只存文件名统一拼链接。
 * 列表一次拉全量精简(945 条)后前端内存筛选;详情按需单只。
 * 中文预留:详情数据未来可含 zh 覆盖层,经 pick() 做 zh||en 合并。
 */

const STATIC = import.meta.env.VITE_STATIC_BASE || 'https://static.linow.us.kg';
const API = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8787';
export const SW_BASE = `${STATIC}/sw`;
const SW_DATA = `${API}/sw/data`;

export const monsterImg = (file, large = false) => `${SW_BASE}/${large ? 'monsters' : 'monsters36'}/${file}`;
export const skillIconUrl = (file) => `${SW_BASE}/skills/${file}`;
// 上游仅引用 36px 队长/效果图标(无全尺寸目录),沿用小图
export const leaderIconUrl = (file) => `${SW_BASE}/leader_skills36/${file}`;
export const effectIconUrl = (file) => `${SW_BASE}/skill_effects36/${file}`;

/** zh||en 字段合并(中文化预留,当前数据无 zh 自然回退英文) */
export const pick = (zh, en) => (zh && String(zh).trim() ? zh : en);

async function getJson(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

/** 全量精简列表(945 条,一次拉取后内存筛选) */
export function fetchMonsterList() {
	return getJson(`${SW_DATA}/monsters_min.json`);
}

/** 单只魔灵详情 */
export function fetchMonster(id) {
	return getJson(`${SW_DATA}/monster/${id}.json`);
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
