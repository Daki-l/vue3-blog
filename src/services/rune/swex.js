/**
 * SWEX 导出档案解析器(纯函数, 浏览器/Node 双端可用)。
 * 输入为具备 async text() 的对象(Blob/File/测试桩), 输出归一化账号结构,
 * 供符文工作台评分/展示消费; 本模块只做解析与归一化裁剪, 不含任何评分业务。
 *
 * 金样本实证(酱妳曖-18632815):
 * - 符文有两个来源: 顶层 runes(库存, occupied_id=0) 与 unit_list[].runes(已装备,
 *   occupied_id=unit_id), 两侧 id 不重叠, 解析时按 rune_id 合并;
 * - rune_lock_list 为 {rune_id,...} 对象数组, 命中即视为锁定;
 * - sec_eff 元素为 [statType, 基础值, 宝石标志(0/1), 磨砺值], 基础值不含磨砺。
 */

/** statType 编号 → 英文 slug(7 不存在; 奇数 1/3/5 为固定值, 偶数 2/4/6 为百分比) */
const STAT_TYPES = {
	1: 'hp_flat',
	2: 'hp_pct',
	3: 'atk_flat',
	4: 'atk_pct',
	5: 'def_flat',
	6: 'def_pct',
	8: 'spd',
	9: 'cr',
	10: 'cd',
	11: 'res',
	12: 'acc'
};

/** 已知套装 set_id 白名单(9/12 不存在, 1-25 连续编号挖空) */
const KNOWN_SET_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);

/** statType 编号 → slug; 未知编号记 warning 并以 unknown_N 占位(不中断) */
const statSlug = (type, runeId, warnings) => {
	const slug = STAT_TYPES[type];
	if (!slug) {
		warnings.push(`rune ${runeId} 未知 statType ${type}`);
		return `unknown_${type}`;
	}
	return slug;
};

/** 效果对 [statType, value] → {stat, value}(stat 经 statSlug 归一化) */
const effPair = (pair, runeId, warnings) => ({ stat: statSlug(pair[0], runeId, warnings), value: pair[1] });

/**
 * 单条 SWEX 原始 rune → 归一化结构(下游 score.js 依赖此形状, 勿改字段名)。
 * class>10 为远古(实际星级=class-10); 评分用副属性取 value+grind。
 */
function normalizeRune(r, lockedIds, warnings) {
	const id = r.rune_id;
	const cls = Number(r.class) || 0;
	const ancient = cls > 10;
	if (r.slot_no == null) warnings.push(`rune ${id} 缺少 slot_no`);
	if (!KNOWN_SET_IDS.has(r.set_id)) warnings.push(`rune ${id} 未知 set_id ${r.set_id}`);
	// 主属性 pri_eff: 必有, 缺失时以空对象兜底
	const main = Array.isArray(r.pri_eff) && r.pri_eff.length >= 2
		? effPair(r.pri_eff, id, warnings)
		: (warnings.push(`rune ${id} 缺少 pri_eff`), { stat: null, value: 0 });
	// 固有属性 prefix_eff: [0,0] 视为无固有
	let innate = null;
	if (Array.isArray(r.prefix_eff) && r.prefix_eff.length >= 2) {
		if (r.prefix_eff[0] !== 0 || r.prefix_eff[1] !== 0) innate = effPair(r.prefix_eff, id, warnings);
	} else {
		warnings.push(`rune ${id} 缺少 prefix_eff`);
	}
	// 副属性 sec_eff: 元素 [statType, 基础值, 宝石标志, 磨砺值]
	let subs = [];
	if (Array.isArray(r.sec_eff)) {
		subs = r.sec_eff
			.filter((e) => Array.isArray(e) && e.length >= 2)
			.map((e) => ({ stat: statSlug(e[0], id, warnings), value: e[1], gem: e[2] === 1, grind: e[3] || 0 }));
	} else {
		warnings.push(`rune ${id} 缺少 sec_eff`);
	}
	return {
		id,
		setId: r.set_id,
		slot: r.slot_no ?? null,
		stars: ancient ? cls - 10 : cls,
		ancient,
		level: r.upgrade_curr ?? 0,
		main,
		innate,
		subs,
		equipped: (Number(r.occupied_id) || 0) > 0 ? r.occupied_id : null,
		locked: lockedIds.has(id),
		sellValue: r.sell_value ?? 0
	};
}

/**
 * 解析 SWEX 导出档案为归一化结构(体积裁剪: 只保留工作台所需字段)。
 * @param {object} file 具备 async text() 的对象(Blob/File/测试桩)
 * @returns {Promise<object>} 成功: { ok:true, wizard, monsters, runes, artifacts,
 *   lockedIds(数组), warnings }; 失败: { ok:false, reason:'bad_json'|'not_swex' }
 */
export async function parseProfile(file) {
	// 读取并解析 JSON, 非法 JSON → bad_json
	let raw;
	try {
		raw = JSON.parse(await file.text());
	} catch (e) {
		return { ok: false, reason: 'bad_json' };
	}
	// 格式判定: 顶层对象须存在 wizard_info 或 unit_list
	if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !(raw.wizard_info || raw.unit_list)) {
		return { ok: false, reason: 'not_swex' };
	}
	const warnings = [];
	// ---- wizard: wizard_info 精简为 {id,name}, 顶层 wizard_id 兜底 ----
	const wi = raw.wizard_info || {};
	const wizard = { id: wi.wizard_id ?? raw.wizard_id ?? null, name: wi.wizard_name ?? null };
	if (wizard.id == null) warnings.push('缺少 wizard_id');
	if (wizard.name == null) warnings.push('缺少 wizard_name');
	// ---- unit_list → monsters(只留 4 字段) ----
	if (!Array.isArray(raw.unit_list)) warnings.push('缺少 unit_list');
	const unitList = Array.isArray(raw.unit_list) ? raw.unit_list : [];
	const monsters = unitList.map((u) => {
		if (u.unit_id == null) warnings.push('unit 缺少 unit_id');
		return { unitId: u.unit_id ?? null, masterId: u.unit_master_id ?? null, class: u.class ?? 0, level: u.unit_level ?? 0 };
	});
	// ---- 符文合并: 顶层 runes(库存) + unit_list[].runes(已装备), 按 rune_id 去重 ----
	// 金样本中两侧 id 不重叠; 若重叠保留 occupied_id>0 的副本(含佩戴信息)
	const runeMap = new Map();
	const putRune = (r) => {
		if (!r || typeof r !== 'object') return;
		if (r.rune_id == null) {
			warnings.push('存在缺少 rune_id 的符文, 已跳过');
			return;
		}
		const prev = runeMap.get(r.rune_id);
		if (!prev || ((Number(prev.occupied_id) || 0) <= 0 && (Number(r.occupied_id) || 0) > 0)) runeMap.set(r.rune_id, r);
	};
	if (Array.isArray(raw.runes)) raw.runes.forEach(putRune);
	else warnings.push('缺少顶层 runes');
	for (const u of unitList) if (Array.isArray(u.runes)) u.runes.forEach(putRune);
	// ---- 锁定表: 元素为 {rune_id,...} 对象(实证), 兼容纯数字形态 ----
	const lockedIds = new Set();
	if (Array.isArray(raw.rune_lock_list)) {
		for (const it of raw.rune_lock_list) {
			const id = it && typeof it === 'object' ? it.rune_id : it;
			if (id != null) lockedIds.add(id);
		}
	} else if (raw.rune_lock_list !== undefined) {
		warnings.push('rune_lock_list 非数组');
	}
	// ---- 归一化 + 体积裁剪 ----
	const runes = [...runeMap.values()].map((r) => normalizeRune(r, lockedIds, warnings));
	// ---- 副本 artifacts: 原始 id 字段为 rid, 只保留 {id, slot} ----
	const artifacts = Array.isArray(raw.artifacts)
		? raw.artifacts.filter((a) => a && typeof a === 'object' && a.rid != null).map((a) => ({ id: a.rid, slot: a.slot ?? null }))
		: (warnings.push('缺少 artifacts'), []);
	return { ok: true, wizard, monsters, runes, artifacts, lockedIds: [...lockedIds], warnings };
}
