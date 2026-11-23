/**
 * 符文效率评分与出售建议(纯函数, 无浏览器 API, 可被 Node 直接 import 测试;
 * 与 swex.js / meta.js 解耦——meta 由调用方传入)。
 *
 * 口径(统一百分数制): 单条副属性效率 = (value + grind) / 该星级档位该属性满roll上限 × 100,
 * 即「1 次满roll = 100 分」; 4 条副属性全部满roll → subsEff = 400。
 *   subsEff  = Σ 各副属性效率(含磨砺 grind, 不含主属性)
 *   totalEff = subsEff + 固有属性效率(同样 ×100, 无固有则不加)
 *   rolls.pct = sub.value / 满roll上限(0~1+ 比率, 不含磨砺), isMax = pct >= 1
 * 边界: 星级查不到分母表(< 5 无 "5"/"6" 档)或 stat 不在表内 → 该条按 0 计并收集到 issues。
 */

/** 取某星级档位某属性的满roll上限; 查不到(未知星级/未知 stat)返回 null */
function maxRollFor(meta, stars, stat) {
	const v = meta?.maxRolls?.[String(stars)]?.[stat];
	return typeof v === 'number' && v > 0 ? v : null;
}

/**
 * 效率评分
 * @param {object} rune 归一化符文(swex.js 产出形状)
 * @param {object} meta rune_meta.json(至少含 maxRolls)
 * @returns {{subsEff:number, totalEff:number, rolls:Array, issues:Array}} 效率值不取整, 由 UI 自行格式化
 */
export function efficiency(rune, meta) {
	const issues = [];
	const rolls = [];
	let subsEff = 0;
	for (const sub of rune.subs || []) {
		const max = maxRollFor(meta, rune.stars, sub.stat);
		if (!max) {
			// 未知 stars(< 5 无分母表)或未知 stat → 该条按 0 计并收集问题
			issues.push({ scope: 'sub', stat: sub.stat, stars: rune.stars, value: sub.value });
			rolls.push({ stat: sub.stat, pct: 0, isMax: false });
			continue;
		}
		// 磨砺计入效率分子(value 本身不含 grind); rolls.pct 展示原始 roll 质量故不含磨砺
		subsEff += ((sub.value || 0) + (sub.grind || 0)) / max * 100;
		const pct = (sub.value || 0) / max;
		rolls.push({ stat: sub.stat, pct, isMax: pct >= 1 });
	}
	let totalEff = subsEff;
	const innate = rune.innate;
	if (innate && innate.stat) {
		const max = maxRollFor(meta, rune.stars, innate.stat);
		if (!max) {
			issues.push({ scope: 'innate', stat: innate.stat, stars: rune.stars, value: innate.value });
		} else {
			totalEff += (innate.value || 0) / max * 100;
		}
	}
	return { subsEff, totalEff, rolls, issues };
}

/**
 * 出售建议: 'keep' | 'sell' | 'consider'
 * 硬规则优先: 已装备(equipped)/已上锁(locked) 一律 keep;
 * 默认规则(可被 rules 覆盖): 6★ 且 level>=12 且 totalEff>=300(约 3 条满roll) → keep;
 * 星级低于 keepStars → sell; 其余(高分低级/低分高级) → consider。
 * @param {object} rules { minEffKeep=300, minLevelKeep=12, keepStars=6 }
 */
export function sellAdvice(rune, meta, rules) {
	if (rune.equipped) return 'keep';
	if (rune.locked) return 'keep';
	const r = rules || {};
	const minEffKeep = r.minEffKeep ?? 300;
	const minLevelKeep = r.minLevelKeep ?? 12;
	const keepStars = r.keepStars ?? 6;
	if (rune.stars >= keepStars && rune.level >= minLevelKeep
		&& efficiency(rune, meta).totalEff >= minEffKeep) {
		return 'keep';
	}
	return rune.stars < keepStars ? 'sell' : 'consider';
}

/**
 * 从 localStorage 读取用户自定义规则('sw_rune_rules' JSON)。
 * 独立成函数: Node 测试不 import 后调用即可整体跳过浏览器 API。
 */
export function loadRules() {
	try {
		return JSON.parse(localStorage.getItem('sw_rune_rules') || '{}');
	} catch (e) {
		// JSON 损坏/隐私模式禁用 localStorage → 回退空规则(即默认值)
		return {};
	}
}
