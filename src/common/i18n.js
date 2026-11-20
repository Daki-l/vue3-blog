/**
 * 轻量 i18n(前端页面级,不涉后端):
 * - locale 存 localStorage,切换时整页 reload(免去全站响应式改造)
 * - t(key) 就地求值; en 字典缺项回退 zh
 * - 同步 moment 语言; element-plus 文案由 App.vue 的 ElConfigProvider 处理
 */
import moment from 'moment';
import zh from '@/locales/zh';
import en from '@/locales/en';

export const LOCALES = [
	{ value: 'zh', label: '中文' },
	{ value: 'en', label: 'EN' }
];
const DICTS = { zh, en };
const LOCALE_KEY = 'app_locale';

function initialLocale() {
	const saved = localStorage.getItem(LOCALE_KEY);
	return saved === 'en' || saved === 'zh' ? saved : 'zh';
}

export const locale = initialLocale();
export const isZh = () => locale === 'zh';

moment.locale(locale === 'zh' ? 'zh-cn' : 'en');

/** 取词:当前语言 -> zh 兜底 -> key 原样; 函数值支持插值参数 */
export const t = (key, ...args) => {
	const v = DICTS[locale]?.[key] ?? zh[key];
	if (typeof v === 'function') return v(...args);
	return v ?? key;
};

/** 后端下发的导航菜单名(中文) -> 英文; 未收录返回原名 */
const NAV_EN = {
	'首页': 'Home',
	'地下城介绍': 'Dungeons',
	'巨人地下城': 'Giant\'s Keep',
	'龙之地下城': 'Dragon\'s Lair',
	'死亡地下城': 'Necropolis',
	'精灵地下城': 'Fairy Realm',
	'钢铁地下城': 'Steel Fortress',
	'惩罚者地下城': 'Punisher\'s Crypt',
	'公告': 'Notices',
	'兑换码直兑': 'Redeem Codes',
	'留言板': 'Message Board'
};
export const navName = (name) => (locale === 'en' ? NAV_EN[name] || name : name);

/** 切换语言:持久化后整页刷新(简单可靠,数据层随语言重取) */
export const setLocale = (next) => {
	if (next === locale || !DICTS[next]) return;
	localStorage.setItem(LOCALE_KEY, next);
	window.location.reload();
};
