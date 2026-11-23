/**
 * 符文元数据: 套装表/属性中文名/档位满roll分母表, 随包静态资源 public/sw/rune_meta.json
 * (构建工具链产出, 与 swex.js 解耦不互相 import)。
 * 形状: { sets:{"1":{name,pieces,effect}}, stats, statsShort, grades,
 *        maxRolls:{"5":{hp_flat:300,...},"6":{...}}, slotMain }
 * stat slug: hp_flat/hp_pct/atk_flat/atk_pct/def_flat/def_pct/spd/cr/cd/res/acc
 */

/** 模块级缓存(仿 monster.js formsCache: 首次调用发起请求, 之后复用同一 Promise) */
let runeMetaCache = null;

/** 拉取符文元数据(全站共用一份, 重复调用不重复请求) */
export function fetchRuneMeta() {
	runeMetaCache = runeMetaCache || (async () => {
		const res = await fetch(`${import.meta.env.BASE_URL}sw/rune_meta.json`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return res.json();
	})();
	return runeMetaCache;
}
