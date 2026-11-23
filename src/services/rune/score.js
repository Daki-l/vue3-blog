/**
 * 符文评分与出售建议 v2(纯函数, 无浏览器 API, 可被 Node 直接 import 测试;
 * 与 swex.js / meta.js 解耦——meta 由调用方传入)。
 *
 * 出售判定模型(逆向自 swlens Rune Lens 的 verdicts 结构, 用透明公式近似):
 *   1. rlScore   角色权重分: 对每个角色预设(输出/坦克/辅助/全能)按副属性 roll 质量 × 属性权重求和,
 *                取最优角色 —— 速度权重最高, 与社区"速度即价值"共识一致。量级校准到 ~0-500。
 *   2. line      分界线: autoLine = 自己库存(已满级且主属性合格者)RL 分的 40 分位数, 账号越肝线越高;
 *                也可手动指定(rules.line 覆盖)。
 *   3. verdict   (顺序优先)
 *                a. 已装备/已上锁 → keep(硬规则)
 *                b. 未满级(level < rules.powerupLevel, 默认 12, 含已装备) → powerup(先强化再判定)
 *                c. 偶数槽平值主属性 / 6号位抵抗主属性 → 速度载体(副属性速度≥3个满roll)则 keep(speed),
 *                   否则 sell(flat-main/res-main) —— 无论 RL 分多高
 *                d. rl >= line → keep
 *                e. rl < line: 模拟"最差副属性 → 最优属性满roll+磨砺"的改造,
 *                   改造后过线 → gem(附改造方案), 仍不过线 → sell(not-worth)
 *
 * 效率口径(v1 保留): 单条 = (value+grind)/满roll × 100, 4 条满roll = 400。
 */

/** 取某星级档位某属性的满roll上限; 查不到返回 null */
function maxRollFor(meta, stars, stat) {
	const v = meta?.maxRolls?.[String(stars)]?.[stat];
	return typeof v === 'number' && v > 0 ? v : null;
}

/** 角色预设: 副属性权重(速度最贵) */
export const ROLE_PRESETS = {
	dmgATK: { label: '输出·攻击', w: { spd: 6, cr: 5, cd: 5, atk_pct: 4, acc: 3, hp_pct: 1, def_pct: 1, res: 1 } },
	dmgHP: { label: '输出·体力', w: { spd: 6, cr: 5, cd: 5, hp_pct: 4, acc: 3, atk_pct: 1, def_pct: 1, res: 1 } },
	dmgDEF: { label: '输出·防御', w: { spd: 6, cr: 5, cd: 5, def_pct: 4, acc: 3, atk_pct: 1, hp_pct: 1, res: 1 } },
	tank: { label: '坦克', w: { hp_pct: 5, def_pct: 5, res: 4, spd: 2.5, acc: 1.5, atk_pct: 0.5, cr: 0.5, cd: 0.5 } },
	support: { label: '辅助', w: { spd: 6, res: 4.5, acc: 4.5, hp_pct: 3, def_pct: 1.5, atk_pct: 0.5, cr: 0.5, cd: 0.5 } },
	allround: { label: '全能', w: { spd: 5, hp_pct: 3, def_pct: 3, atk_pct: 3, cr: 3, cd: 3, res: 2.5, acc: 2.5 } }
};
/** 量级校准系数: 让典型 6★ 满级符文落在 0~500 区间(与参考站观测量级一致) */
const RL_SCALE = 20;

/**
 * 角色+贡献明细(供 rlScore 与改造模拟复用)
 * @returns {{score:number, role:string, parts:Array<{stat,contrib,rolls}>}} contrib 已乘权重
 */
function roleFit(rune, meta) {
	const rows = [];
	for (const sub of rune.subs || []) {
		const max = maxRollFor(meta, rune.stars, sub.stat);
		if (!max) continue;
		rows.push({ stat: sub.stat, rolls: ((sub.value || 0) + (sub.grind || 0)) / max, raw: sub });
	}
	const innate = rune.innate && rune.innate.stat ? rune.innate : null;
	const innateMax = innate ? maxRollFor(meta, rune.stars, innate.stat) : null;

	let best = null;
	for (const [role, preset] of Object.entries(ROLE_PRESETS)) {
		const parts = [];
		let sum = 0;
		for (const r of rows) {
			const w = preset.w[r.stat];
			if (!w) continue;
			const contrib = w * r.rolls;
			parts.push({ stat: r.stat, contrib, rolls: r.rolls });
			sum += contrib;
		}
		// 固有属性按半权计入(白送但不占副属性位)
		if (innate && innateMax) {
			const w = preset.w[innate.stat];
			if (w) {
				sum += w * (innate.value / innateMax) * 0.5;
				parts.push({ stat: innate.stat, contrib: w * (innate.value / innateMax) * 0.5, rolls: innate.value / innateMax });
			}
		}
		if (!best || sum > best.score) best = { score: sum * RL_SCALE, role, parts };
	}
	return best || { score: 0, role: 'allround', parts: [] };
}

/**
 * RL 分(角色权重分)
 * @returns {{score:number, role:string}}
 */
export function rlScore(rune, meta) {
	const fit = roleFit(rune, meta);
	return { score: Math.round(fit.score * 10) / 10, role: fit.role };
}

/**
 * 自动分界线: 已满级且主属性合格(偶数槽非平值)符文的 RL 分 35 分位数(同账号对照 swlens 实判一致率 73.4%, 取其最优)。
 * 样本 < 20 时回退固定 180(保守值)。
 */
export function autoLine(runes, meta) {
	const scores = [];
	for (const r of runes || []) {
		if ((r.level || 0) < 12) continue;
		if ([2, 4, 6].includes(r.slot) && /_flat$/.test(r.main?.stat || '')) continue;
		scores.push(roleFit(r, meta).score);
	}
	if (scores.length < 20) return 180;
	scores.sort((a, b) => a - b);
	const q = Math.floor(scores.length * 0.35);
	return Math.round(scores[Math.min(q, scores.length - 1)]);
}

/**
 * 改造模拟: 把贡献最低的副属性换成该角色权重最高、当前缺失的属性(满roll+满磨砺≈1.5roll)。
 * @returns {{from:string, to:string, gain:number} | null} 无可换/无可增益返回 null
 */
function gemPlan(rune, meta, fit) {
	if (!fit.parts.length) return null;
	const preset = ROLE_PRESETS[fit.role].w;
	const present = new Set((rune.subs || []).map((s) => s.stat));
	// 目标: 权重最高的未出现属性
	let to = null, toW = 0;
	for (const [stat, w] of Object.entries(preset)) {
		if (present.has(stat)) continue;
		if (w > toW && maxRollFor(meta, rune.stars, stat)) { to = stat; toW = w; }
	}
	if (!to) return null;
	// 最差贡献条
	let worst = fit.parts[0];
	for (const p of fit.parts) if (p.contrib < worst.contrib) worst = p;
	const newRolls = 1.5; // 满roll + 满磨砺近似
	const gain = (toW * newRolls - worst.contrib) * RL_SCALE;
	return gain > 0 ? { from: worst.stat, to, gain } : null;
}

/** 偶数槽平值主属性 / 6号位抵抗主属性 判定 */
function weakMain(rune) {
	const m = rune.main?.stat || '';
	if ([2, 4, 6].includes(rune.slot) && /_flat$/.test(m)) return 'flat-main';
	if (rune.slot === 6 && m === 'res') return 'res-main';
	return null;
}

/** 速度载体: 副属性速度 roll 数(含磨砺) */
function speedRolls(rune, meta) {
	const spd = (rune.subs || []).find((s) => s.stat === 'spd');
	const max = maxRollFor(meta, rune.stars, 'spd');
	return spd && max ? ((spd.value || 0) + (spd.grind || 0)) / max : 0;
}

/**
 * 出售判定 v2
 * @param {object} rune 归一化符文
 * @param {object} meta rune_meta(需 maxRolls)
 * @param {object} rules { line?:number(手动线, 缺省用 fallbackLine), fallbackLine=180, maxLevel=12 }
 * @returns {{verdict:'keep'|'sell'|'gem'|'powerup', why:string, line:number, rl:number, role:string, plan?:{from,to,gain}, potential?:number}}
 */
export function sellAdvice(rune, meta, rules) {
	const r = rules || {};
	const line = typeof r.line === 'number' ? r.line : (r.fallbackLine ?? 180);
	const powerupLevel = r.powerupLevel ?? 12;
	// 优先级校准自 swlens 行为: 未满 +12 一律先强化(含已装备的), 其 powerup 全部 <12 级
	const fit = roleFit(rune, meta);
	const rl = Math.round(fit.score * 10) / 10;

	if ((rune.level || 0) < powerupLevel && rune.stars >= 5) {
		return { verdict: 'powerup', why: 'unfinished', line, rl, role: fit.role };
	}
	if (rune.locked) return { verdict: 'keep', why: 'locked', line, rl, role: fit.role };
	if (rune.equipped) return { verdict: 'keep', why: 'equipped', line, rl, role: fit.role };
	// 弱主属性: 仅当速度载体(≥3个满roll速度)才保留
	const weak = weakMain(rune);
	if (weak) {
		if (speedRolls(rune, meta) >= 3) return { verdict: 'keep', why: 'speed', line, rl, role: fit.role };
		return { verdict: 'sell', why: weak, line, rl, role: fit.role };
	}
	if (rl >= line) return { verdict: 'keep', why: 'line', line, rl, role: fit.role };
	const plan = gemPlan(rune, meta, fit);
	const potential = plan ? Math.round((rl + plan.gain) * 10) / 10 : rl;
	if (plan && potential >= line) {
		return { verdict: 'gem', why: 'gem', line, rl, role: fit.role, plan, potential };
	}
	return { verdict: 'sell', why: 'not-worth', line, rl, role: fit.role, plan: plan || undefined, potential };
}

/**
 * 效率评分(v1 保留, 详情抽屉的 roll 质量条仍在用)
 * @returns {{subsEff:number, totalEff:number, rolls:Array, issues:Array}}
 */
export function efficiency(rune, meta) {
	const issues = [];
	const rolls = [];
	let subsEff = 0;
	for (const sub of rune.subs || []) {
		const max = maxRollFor(meta, rune.stars, sub.stat);
		if (!max) {
			issues.push({ scope: 'sub', stat: sub.stat, stars: rune.stars, value: sub.value });
			rolls.push({ stat: sub.stat, pct: 0, isMax: false });
			continue;
		}
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
 * 从 localStorage 读取用户自定义规则('sw_rune_rules' JSON)。
 * 独立成函数: Node 测试不调用即可整体跳过浏览器 API。
 */
export function loadRules() {
	try {
		return JSON.parse(localStorage.getItem('sw_rune_rules') || '{}');
	} catch (e) {
		return {};
	}
}
