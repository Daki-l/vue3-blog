/**
 * 符文评分与出售建议 v2.5(纯函数, 无浏览器 API, 可被 Node 直接 import 测试;
 * 与 swex.js / meta.js 解耦——meta 由调用方传入)。
 *
 * 判定体系逆向自 swlens Rune Lens 同账号 2844 条实判(verdicts + RL分 + 理由文本),
 * 权重表由逐符文回归拟合(组内排序相关 0.77~0.85), 同账号判定一致率: 自动线全量 83% /
 * 手动线 230 抽样 79%。线性模型的上限大致在此, 余下分歧集中在近线区的 keep/gem/sell 边界:
 *   1. rlScore   角色权重分: 副属性 roll 质量((value+grind)/满roll) × 属性权重求和,
 *                六角色取最优。量级即参考站观测量级(典型满级符文 100~500)。
 *                拟合揭示: 参考站对速度/暴击/爆伤近乎全角色通用地给最高权重(≈50/满roll),
 *                角色只在主属性维度上小幅倾斜——并非"坦克不看暴击"。
 *   2. line      分界线: autoLine = 库存中"已可终判"符文(满级或5★以下)RL 的 24 分位;
 *                也可手动指定(rules.line 覆盖)。
 *   3. verdict   (顺序优先)
 *                a. 已上锁 → keep
 *                b. 5★以下 → sell(low-stars)
 *                c. 偶数槽平值主/6号位抵抗主 → sell(flat-main/res-main), 不设速度豁免
 *                d. 未满级: 满级投影 RL + 28×剩余roll数 ≥ 线-50 → powerup, 否则 sell(not-worth)
 *                e. 速度载体(单条速度≥22)不过线也 keep(speed)
 *                f. rl ≥ line → keep
 *                g. 单颗传奇宝石改造模拟过线 → gem(附方案)
 *                h. sell(not-worth)
 *                已装备符文不设硬保留——参考站对已装备符文照常给出 sell/gem(校准数据中
 *                已装备被建议出售 262 / 改造 201), UI 单独展示佩戴状态。
 *
 * 效率(百分数, 与参考站逐颗一致, 见 efficiency()): (基数 + Σ成长当量) ÷ 14 × 100;
 * 成长当量以 6★ 满成长值为基准, 平值类减半, 含磨砺与固有属性。
 */

/** 取某星级档位某属性的满roll上限; 查不到返回 null */
function maxRollFor(meta, stars, stat) {
	const v = meta?.maxRolls?.[String(stars)]?.[stat];
	return typeof v === 'number' && v > 0 ? v : null;
}

/**
 * 角色权重表: 由参考站 2844 条实判 RL 分回归拟合(每满roll的权重分), 非人工估计。
 * 缺省属性权重 0。
 */
export const ROLE_PRESETS = {
	dmgATK: { label: '输出·攻击', w: { spd: 44.4, cr: 50.4, cd: 47.2, atk_pct: 49.7, hp_pct: 28.6, def_pct: 27.8, acc: 14.4, res: 10.2, atk_flat: 3.8, def_flat: 1.4 } },
	dmgHP: { label: '输出·体力', w: { spd: 48.2, cr: 53.3, cd: 54.8, hp_pct: 46.2, atk_pct: 38.8, def_pct: 23.5, acc: 22.3, res: 14.7, hp_flat: 9.1, def_flat: 7.5 } },
	dmgDEF: { label: '输出·防御', w: { spd: 48.7, cr: 50.5, cd: 54.4, def_pct: 50.4, hp_pct: 40.3, atk_pct: 36.5, acc: 24.1, res: 2.9, def_flat: 7.3 } },
	tank: { label: '坦克', w: { spd: 46.8, cr: 52.2, cd: 52.2, hp_pct: 50.3, def_pct: 43.8, atk_pct: 30.6, res: 11.1, acc: 9.4, hp_flat: 11.5, atk_flat: 4.1 } },
	support: { label: '辅助', w: { spd: 48.1, def_pct: 47.3, hp_pct: 42.1, atk_pct: 42.1, cr: 41.9, cd: 41.5, res: 17.1, acc: 14.9, hp_flat: 1.3 } },
	allround: { label: '全能', w: { spd: 42, cr: 50.4, cd: 48.9, atk_pct: 46.1, hp_pct: 43.6, def_pct: 45.4, acc: 22.1, res: 17.5, atk_flat: 7.1, def_flat: 6.8 } }
};

/** 单颗传奇宝石数值(改造模拟用): 换上后该副属性固定为该值(不含磨砺) */
const GEM_VALUES = { hp_flat: 1170, hp_pct: 11, atk_flat: 90, atk_pct: 11, def_flat: 90, def_pct: 11, spd: 5, cr: 6, cd: 7, res: 11, acc: 11 };
/** 未满级投影: 每剩余一roll期望 +28 分; 距线 50 以内即值得先强化 */
const PROJ_PER_ROLL = 28;
const PROJ_MARGIN = 50;
/** 速度载体判定: 单条速度(含磨砺)达到该值即无条件保留 */
const SPEED_KEEP = 22;

/**
 * 角色+贡献明细(供 rlScore 与改造模拟复用)
 * @returns {{score:number, role:string, parts:Array<{stat,contrib,rolls}>}} contrib 已乘权重
 */
function roleFit(rune, meta) {
	const rows = [];
	for (const sub of rune.subs || []) {
		const max = maxRollFor(meta, rune.stars, sub.stat);
		if (!max) continue;
		rows.push({ stat: sub.stat, rolls: ((sub.value || 0) + (sub.grind || 0)) / max });
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
				const contrib = w * (innate.value / innateMax) * 0.5;
				sum += contrib;
				parts.push({ stat: innate.stat, contrib, rolls: innate.value / innateMax });
			}
		}
		if (!best || sum > best.score) best = { score: sum, role, parts };
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
 * 自动分界线: 已满级符文 RL 分的 q 分位(默认 25, 与参考站 autoLine 同构——其 head 字段暴露
 * autoLine=177 恰为本号满级 RL 的 24.8 分位)。样本 < 20 回退固定 210。
 * @param {number} [q=0.25] 分位(0~1)
 */
export function autoLine(runes, meta, q = 0.25) {
	const scores = [];
	for (const r of runes || []) {
		if ((r.level || 0) < 12) continue;
		scores.push(roleFit(r, meta).score);
	}
	if (scores.length < 20) return 210;
	scores.sort((a, b) => a - b);
	const i = Math.min(Math.floor(scores.length * q), scores.length - 1);
	return Math.round(scores[i]);
}

/**
 * 改造模拟: 遍历"任一现有副属性 → 任一未拥有属性(按传奇宝石固定值)", 取 RL 增益最大者。
 * @returns {{from:string, to:string, gain:number} | null} 无正增益返回 null
 */
function gemPlan(rune, meta, fit) {
	if ((rune.subs || []).length < 4) return null; // 未满4条先补条, 谈不上定向改造
	const w = ROLE_PRESETS[fit.role].w;
	const present = new Set();
	for (const s of rune.subs || []) present.add(s.stat);
	if (rune.innate?.stat) present.add(rune.innate.stat);
	let best = null;
	for (const p of fit.parts) {
		if (!w[p.stat]) continue;
		for (const [to, gv] of Object.entries(GEM_VALUES)) {
			if (present.has(to)) continue;
			const toMax = maxRollFor(meta, rune.stars, to);
			if (!toMax || !w[to]) continue;
			const gain = (w[to] * gv) / toMax - p.contrib;
			if (gain > 0 && (!best || gain > best.gain)) best = { from: p.stat, to, gain };
		}
	}
	return best;
}

/** 偶数槽平值主属性 / 6号位抵抗主属性 判定 */
function weakMain(rune) {
	const m = rune.main?.stat || '';
	if ([2, 4, 6].includes(rune.slot) && /_flat$/.test(m)) return 'flat-main';
	if (rune.slot === 6 && m === 'res') return 'res-main';
	return null;
}

/** 单条速度值(副属性含磨砺取最大; 固有速度也算) */
function speedValue(rune) {
	let v = 0;
	for (const s of rune.subs || []) {
		if (s.stat === 'spd') v = Math.max(v, (s.value || 0) + (s.grind || 0));
	}
	if (rune.innate?.stat === 'spd') v = Math.max(v, rune.innate.value || 0);
	return v;
}

/**
 * 出售判定 v2.5
 * @param {object} rune 归一化符文
 * @param {object} meta rune_meta(需 maxRolls)
 * @param {object} rules { line?:number(手动线, 缺省用 fallbackLine), fallbackLine=210, powerupLevel=12 }
 * @returns {{verdict:'keep'|'sell'|'gem'|'powerup', why:string, line:number, rl:number, role:string, plan?:{from,to,gain}, potential?:number}}
 */
export function sellAdvice(rune, meta, rules) {
	const r = rules || {};
	const line = typeof r.line === 'number' ? r.line : (r.fallbackLine ?? 210);
	const powerupLevel = r.powerupLevel ?? 12;
	const fit = roleFit(rune, meta);
	const rl = Math.round(fit.score * 10) / 10;
	const spd = speedValue(rune);

	if (rune.locked) return { verdict: 'keep', why: 'locked', line, rl, role: fit.role };
	if (rune.stars < 5) return { verdict: 'sell', why: 'low-stars', line, rl, role: fit.role };
	// 弱主属性一律出售, 不设速度豁免(参考站同账号弱主属性满级符文 13/13 出售, 含 5 条速度≥22)
	const weak = weakMain(rune);
	if (weak) return { verdict: 'sell', why: weak, line, rl, role: fit.role };
	if ((rune.level || 0) < powerupLevel) {
		// 满级投影: 剩余每roll按期望 +PROJ_PER_ROLL, 距线 PROJ_MARGIN 内即值得先强化
		const remain = Math.ceil((powerupLevel - (rune.level || 0)) / 3);
		const potential = Math.round((rl + PROJ_PER_ROLL * remain) * 10) / 10;
		if (potential >= line - PROJ_MARGIN) {
			return { verdict: 'powerup', why: 'unfinished', line, rl, role: fit.role, potential };
		}
		return { verdict: 'sell', why: 'not-worth', line, rl, role: fit.role, potential };
	}
	if (spd >= SPEED_KEEP) return { verdict: 'keep', why: 'speed', line, rl, role: fit.role };
	if (rl >= line) return { verdict: 'keep', why: 'line', line, rl, role: fit.role };
	const plan = gemPlan(rune, meta, fit);
	const potential = plan ? Math.round((rl + plan.gain) * 10) / 10 : rl;
	if (plan && potential >= line) {
		return { verdict: 'gem', why: 'gem', line, rl, role: fit.role, plan, potential };
	}
	return { verdict: 'sell', why: 'not-worth', line, rl, role: fit.role, plan: plan || undefined, potential };
}

/**
 * 各星级主属性 +15 满值(效率基数用)。5★/6★ 为实测值; 3★/4★ 中有样本的取自参考站实判反推
 * (3★: 攻/防 93、体 1380、攻% 38; 4★: 防 113、体 1704), 其余按星级线性内插——
 * 这类符文一律判出售, 效率仅作展示。
 */
const MAIN_MAX = {
	6: { hp_flat: 2448, atk_flat: 160, def_flat: 160, hp_pct: 63, atk_pct: 63, def_pct: 63, spd: 42, cr: 58, cd: 80, res: 64, acc: 64 },
	5: { hp_flat: 2088, atk_flat: 135, def_flat: 135, hp_pct: 51, atk_pct: 51, def_pct: 51, spd: 39, cr: 47, cd: 65, res: 51, acc: 51 },
	4: { hp_flat: 1704, atk_flat: 113, def_flat: 113, hp_pct: 45, atk_pct: 45, def_pct: 45, spd: 36, cr: 41, cd: 57, res: 45, acc: 45 },
	3: { hp_flat: 1380, atk_flat: 93, def_flat: 93, hp_pct: 38, atk_pct: 38, def_pct: 38, spd: 33, cr: 36, cd: 52, res: 38, acc: 38 }
};
const FLAT_STATS = new Set(['hp_flat', 'atk_flat', 'def_flat']);
/** 效率: (基数 + 成长当量之和) ÷ 14 × 100 */
const EFF_SCALE = 100 / 14;

/**
 * 效率(百分数)。与参考站同账号 2844 颗符文逐颗比对: 6★ 2757/2757 精确一致, 全库 99.8%。
 *   效率% = (基数 + Σ成长当量) ÷ 14 × 100
 *   成长当量 = 实际值(含磨砺) ÷ 6★ 满成长值, 平值类(体力/攻击/防御固定值)减半;
 *              副属性与固有属性同口径, 任何星级都以 6★ 为基准(低星符文天然偏低)
 *   基数     = 5 × 本星级主属性 +15 满值 ÷ 6★ 满值(6★ 恒为 5; 与等级、副属性条数无关)
 * @returns {{totalEff:number, baseEff:number, subsEff:number, innateEff:number, rolls:Array}}
 *   rolls: 各副属性原始成长当量(pct = 不含磨砺的值 ÷ 6★ 满成长值, 单条上限 5),
 *          isMax = 达到 4 次及以上(四条满成长), 供详情抽屉的成长当量条使用
 */
export function efficiency(rune, meta) {
	const max6 = meta?.maxRolls?.['6'] || {};
	const eq = (stat, value) => {
		const max = max6[stat];
		return max ? (FLAT_STATS.has(stat) ? 0.5 : 1) * value / max : 0;
	};
	const rolls = [];
	let sum = 0;
	for (const sub of rune.subs || []) {
		const value = sub.value || 0;
		sum += eq(sub.stat, value + (sub.grind || 0));
		const pct = max6[sub.stat] ? value / max6[sub.stat] : 0;
		rolls.push({ stat: sub.stat, pct, isMax: pct >= 4 });
	}
	const mainStat = rune.main?.stat;
	const ownMax = MAIN_MAX[String(rune.stars)]?.[mainStat];
	const baseEff = ownMax && MAIN_MAX['6'][mainStat] ? (5 * ownMax) / MAIN_MAX['6'][mainStat] * EFF_SCALE : 0;
	const innateEff = rune.innate?.stat ? eq(rune.innate.stat, rune.innate.value || 0) * EFF_SCALE : 0;
	const subsEff = sum * EFF_SCALE;
	return { totalEff: baseEff + subsEff + innateEff, baseEff, subsEff, innateEff, rolls };
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
