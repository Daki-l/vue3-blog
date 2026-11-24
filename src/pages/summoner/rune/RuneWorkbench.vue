<template>
	<div class="rune_workbench">
		<!-- 顶栏: 标题 + 存档管理 -->
		<div class="wb_header">
			<div class="wb_title">{{ t('rune.workbench') }}</div>
			<div class="wb_actions">
				<el-select v-if="profiles.length" v-model="activeId" size="small" style="width: 200px" @change="onSwitchProfile">
					<el-option v-for="p in profiles" :key="p.id" :label="p.name" :value="p.id" />
				</el-select>
				<el-button size="small" link :icon="QuestionFilled" @click="guideShow = true">{{ t('guide.open') }}</el-button>
				<el-button size="small" type="primary" :loading="importing" @click="pickFile">{{ importing ? t('rune.importing') : t('rune.import') }}</el-button>
				<el-button v-if="profiles.length" size="small" type="danger" plain @click="onDelete">{{ t('rune.deleteProfile') }}</el-button>
				<input ref="fileRef" type="file" accept=".json,application/json" style="display: none" @change="onFile" />
			</div>
		</div>

		<!-- 未导入引导: 导入入口 + SWEX 生成指南 -->
		<div v-if="!importing && !active" class="section_card empty_card">
			<div class="empty_head">
				<div class="empty_text">
					<div class="empty_title">{{ t('rune.noProfile') }}</div>
					<p class="swex_tip">{{ t('rune.localOnly') }}</p>
				</div>
				<el-button type="primary" @click="pickFile">{{ t('rune.import') }}</el-button>
			</div>
			<SwexGuide />
		</div>

		<template v-else-if="active">
			<!-- 存储降级提示 -->
			<div v-if="!storeOk" class="storage_warn">{{ t('rune.storageDown') }}</div>

			<!-- Tab 切换 -->
			<el-tabs v-model="tab" class="wb_tabs">
				<el-tab-pane :label="t('rune.tabRunes')" name="runes">
					<!-- 面板头: 数量 + 判定图例 + 保留标准(结构对齐参考站面板头) -->
					<div class="wb_head_card">
						<div class="hc_row">
							<div class="hc_stat">
								<div class="hc_num">{{ t('rune.headCount', fmtInt(active.runes.length)) }}</div>
								<div class="hc_sub">{{ t('rune.headSub', fmtInt(equippedCount), fmtInt(active.runes.length - equippedCount)) }}</div>
							</div>
							<div class="hc_ctl">
								<el-icon class="hc_ctl_icon"><Flag /></el-icon>
								<span>{{ t('rune.keepStandard') }}</span>
								<el-segmented v-model="lineMode" :options="LINE_MODES" />
								<el-input-number v-if="lineManual" v-model="manualLineV" :min="0" :max="600" :step="5" controls-position="right" class="hc_line_input" />
								<el-select v-else v-model="lineQ" class="hc_q_select">
									<el-option v-for="q in LINE_QS" :key="q" :label="t('rune.lineQuantile', q)" :value="q" />
								</el-select>
							</div>
						</div>
						<div class="hc_row legend_row">
							<div class="hc_legend">
								<span v-for="v in verdictDist" :key="v.k" class="adv_chip" :class="v.k"><i />{{ v.label }} <b>{{ fmtInt(v.n) }}</b></span>
							</div>
							<div class="hc_sets">
								<span class="hc_sets_lbl">{{ t('rune.setDist') }}</span>
								<span v-for="s in setDist" :key="s.id" class="set_chip"><i :style="{ background: setColor(s.id) }" />{{ s.name }} {{ fmtInt(s.n) }}</span>
							</div>
						</div>
					</div>

					<!-- 筛选区: 分组 chip → 下拉/排除 → 搜索/排序 → 结果 -->
					<div class="filter_area">
						<div class="f_row">
							<div class="chip_group">
								<span class="gl">{{ t('rune.filterSlot') }}</span>
								<button v-for="i in 6" :key="i" type="button" class="chip num" :class="{ on: f.slots.includes(i) }" @click="toggleIn(f.slots, i)">{{ i }}</button>
							</div>
							<div class="chip_group">
								<span class="gl">{{ t('rune.filterStars') }}</span>
								<button v-for="i in [4, 5, 6]" :key="i" type="button" class="chip" :class="{ on: f.starsArr.includes(i) }" @click="toggleIn(f.starsArr, i)">{{ i }}★</button>
							</div>
							<div class="chip_group">
								<span class="gl">{{ t('rune.filterQuality') }}</span>
								<button v-for="(nm, q) in QUALITY_NAME" :key="q" type="button" class="chip" :class="{ on: f.quality.includes(q) }" @click="toggleIn(f.quality, q)">
									<i class="qdot" :style="{ background: QUALITY_COLOR[q] }" />{{ nm }}
								</button>
							</div>
							<div class="chip_group">
								<span class="gl">{{ t('rune.filterAncient') }}</span>
								<button v-for="a in ANCIENT_OPTS" :key="a.v" type="button" class="chip" :class="{ on: f.ancient === a.v }" @click="f.ancient = a.v">{{ a.label }}</button>
							</div>
						</div>
						<div class="f_row">
							<el-select v-model="f.sets" multiple collapse-tags collapse-tags-tooltip clearable :placeholder="t('rune.filterSet')" class="w_set">
								<el-option v-for="(s, id) in meta?.sets || {}" :key="id" :label="s.name" :value="Number(id)" />
							</el-select>
							<el-select v-model="f.main" clearable filterable :placeholder="t('rune.filterMain')" class="w_main">
								<el-option v-for="(nm, st) in STAT_OPTS" :key="st" :label="nm" :value="st" />
							</el-select>
							<el-select v-model="f.advice" clearable :placeholder="t('rune.filterAdvice')" class="w_advice">
								<el-option :label="t('rune.adviceKeep')" value="keep" />
								<el-option :label="t('rune.adviceSell')" value="sell" />
								<el-option :label="t('rune.adviceGem')" value="gem" />
								<el-option :label="t('rune.advicePowerup')" value="powerup" />
							</el-select>
							<div class="eff_filter">
								<span>{{ t('rune.filterEff') }}</span>
								<el-input-number v-model="f.minEff" :min="0" :max="200" :step="5" controls-position="right" class="w_eff" />
							</div>
							<div class="excl_group">
								<button type="button" class="pill" :class="{ on: f.exclEquipped }" @click="f.exclEquipped = !f.exclEquipped">
									<el-icon><UserFilled /></el-icon>{{ t('rune.exclEquipped') }}
								</button>
								<button type="button" class="pill" :class="{ on: f.exclLocked }" @click="f.exclLocked = !f.exclLocked">
									<el-icon><Lock /></el-icon>{{ t('rune.exclLocked') }}
								</button>
								<button type="button" class="pill" :class="{ on: f.exclSpeed }" @click="f.exclSpeed = !f.exclSpeed">
									<el-icon><Timer /></el-icon>{{ t('rune.exclSpeed') }}
								</button>
							</div>
						</div>
						<div class="f_row search_row">
							<el-input v-model="f.kw" clearable :placeholder="t('rune.searchPh')" :prefix-icon="Search" class="search_input" />
							<el-select v-model="sortField" class="w_sort_field">
								<el-option :label="t('rune.colEff')" value="eff" />
								<el-option :label="t('rune.colRl')" value="rl" />
							</el-select>
							<el-button class="sort_btn" @click="sortAsc = !sortAsc">
								<el-icon><SortDown v-if="!sortAsc" /><SortUp v-else /></el-icon>
								<span>{{ sortAsc ? t('rune.sortAsc') : t('rune.sortDesc') }}</span>
							</el-button>
						</div>

						<!-- 筛选结果: 命中数 + 线上/线下计数(虚拟表格看不到总数, 这里给全量统计) -->
						<div class="result_bar">
							<span class="rb_count">{{ t('rune.resultCount', fmtInt(filteredRunes.length), fmtInt(active.runes.length)) }}</span>
							<span class="rb_legend">
								<span><i class="dot above" />{{ t('rune.aboveLine', lineV, fmtInt(aboveLineCount)) }}</span>
								<span><i class="dot below" />{{ t('rune.belowLine', lineV, fmtInt(belowLineCount)) }}</span>
							</span>
						</div>
					</div>

					<!-- 虚拟滚动表格 -->
					<div ref="tableBox" class="table_box">
						<el-table-v2
							:columns="columns"
							:data="filteredRunes"
							:width="tableW"
							:height="560"
							:row-height="52"
							:row-class="rowClass"
							:row-event-handlers="rowHandlers"
							fixed
						/>
					</div>
				</el-tab-pane>

				<el-tab-pane :label="t('rune.tabMonsters')" name="monsters">
					<div v-if="!active.monsters.length" class="section_card">{{ t('rune.myMonstersEmpty') }}</div>
					<div v-else class="mon_layout">
						<!-- 左: 魔灵列表 -->
						<div class="mon_list">
							<div
								v-for="u in active.monsters"
								:key="u.unitId"
								class="mon_item"
								:class="{ sel: u.unitId === selUnit?.unitId }"
								@click="selUnit = u"
							>
								<img v-if="unitImg(u.masterId)" :src="unitImg(u.masterId)" loading="lazy" @error="onImgErr" />
								<span class="mon_name">{{ unitName(u.masterId) }}</span>
								<span class="mon_lv">Lv.{{ u.level }}</span>
							</div>
						</div>
						<!-- 右: 构建详情 -->
						<div v-if="selUnit" class="mon_build">
							<div class="build_head">
								<b>{{ unitName(selUnit.masterId) }}</b>
								<span class="role_row">
									<el-tag v-for="r in unitRoles(selUnit.masterId)" :key="r" size="small" type="info">{{ r }}</el-tag>
								</span>
							</div>
							<div class="sug_row" v-if="sugStats.length">
								<span class="sug_label">{{ t('rune.suggested') }}:</span>
								<span v-for="s in sugStats" :key="s" class="sug_chip">{{ s }}</span>
							</div>
							<div class="build_title">{{ t('rune.buildTitle', buildRunes.length) }}</div>
							<div class="rune_cards">
								<div v-for="r in buildRunes" :key="r.id" class="rune_card" @click="openDetail(r)">
									<div class="rc_top">
										<span class="rc_slot">{{ r.slot }}</span>
										<span class="rc_set">{{ setInfo(r.setId)?.name || '#' + r.setId }}</span>
										<span class="rc_stars">{{ r.ancient ? t('rune.ancientTag') : '' }}{{ r.stars }}★+{{ r.level }}</span>
									</div>
									<div class="rc_main">{{ statName(r.main.stat) }} {{ fmtVal(r.main.stat, r.main.value) }}</div>
									<div class="rc_subs">
										<div v-for="(s, i) in r.subs" :key="i">
											{{ statName(s.stat) }} {{ fmtVal(s.stat, s.value)
											}}<b v-if="s.grind" class="grind">+{{ fmtVal(s.stat, s.grind) }}</b>
											<i v-if="s.gem" class="gem">◆</i>
										</div>
									</div>
									<div class="rc_eff">{{ t('rune.colEff') }} {{ effOf(r).toFixed(1) }}%</div>
								</div>
								<div v-for="i in 6 - buildRunes.length" :key="'e' + i" class="rune_card empty_slot">{{ i + buildRunes.length }}</div>
							</div>
						</div>
					</div>
				</el-tab-pane>
			</el-tabs>
		</template>

		<!-- 符文详情(居中弹窗) -->
		<el-dialog v-model="detailShow" :title="t('rune.detailTitle')" width="380px">
			<template v-if="detail">
				<div class="dt_head">
					<span class="dt_slot">#{{ detail.slot }}</span>
					<span class="dt_set">{{ setInfo(detail.setId)?.name || '#' + detail.setId }}</span>
					<span class="dt_stars">{{ detail.ancient ? t('rune.ancientTag') + ' ' : '' }}{{ detail.stars }}★ +{{ detail.level }}</span>
				</div>
				<div class="dt_tags">
					<el-tag v-if="detail.equipped" size="small">{{ t('rune.equippedTag') }}: {{ unitNameById(detail.equipped) }}</el-tag>
					<el-tag v-if="detail.locked" size="small" type="warning">{{ t('rune.lockedTag') }}</el-tag>
					<el-tag size="small" :type="adviceType(detail)">{{ t('rune.advice' + cap(detail._adv?.verdict || adviceOf(detail).verdict)) }}</el-tag>
						<div v-if="whyText(detail)" class="dt_why">{{ whyText(detail) }}</div>
					</div>
					<div class="dt_row main">
						<span>{{ statName(detail.main.stat) }}</span>
						<b>{{ fmtVal(detail.main.stat, detail.main.value) }}</b>
					</div>
					<div v-if="detail.innate" class="dt_row innate">
						<span>{{ statName(detail.innate.stat) }}</span>
						<b>+{{ fmtVal(detail.innate.stat, detail.innate.value) }}</b>
					</div>
					<!-- 效率及其构成: 基数 + 副属性 + 固有 -->
					<div class="dt_row eff">
						<span>{{ t('rune.colEff') }}</span>
						<b>{{ effDetail?.totalEff.toFixed(1) }}%</b>
					</div>
					<div class="dt_formula dt_breakdown">{{ t('rune.effBreak', effDetail?.baseEff.toFixed(1), effDetail?.subsEff.toFixed(1), effDetail?.innateEff.toFixed(1)) }}</div>
					<div class="dt_section">{{ t('rune.rollQuality') }}</div>
					<div v-for="(s, i) in effDetail?.rolls || []" :key="i" class="dt_roll">
						<span class="dr_name">{{ statName(s.stat) }}</span>
						<div class="dr_bar">
							<div class="dr_fill" :class="{ max: s.isMax }" :style="{ width: Math.min(100, (s.pct / MAX_ROLLS) * 100) + '%' }" />
						</div>
						<span class="dr_pct">×{{ +s.pct.toFixed(2) }}</span>
					</div>
				<div class="dt_formula">{{ t('rune.effFormula') }}</div>
			</template>
		</el-dialog>

		<!-- SWEX 生成指南(居中弹窗) -->
		<el-dialog v-model="guideShow" :title="t('guide.title')" width="680px">
			<div class="guide_body">
				<SwexGuide />
			</div>
		</el-dialog>
	</div>
</template>

<script setup>
import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Flag, Lock, QuestionFilled, Search, SortDown, SortUp, Timer, UserFilled } from '@element-plus/icons-vue';
import SwexGuide from './SwexGuide.vue';
import { parseProfile } from '@/services/rune/swex';
import { saveProfile, listProfiles, getProfile, deleteProfile, setActive, getActive, isAvailable } from '@/services/rune/store';
import { efficiency, sellAdvice, loadRules, autoLine, GRINDABLE } from '@/services/rune/score';
import { fetchRuneMeta } from '@/services/rune/meta';
import { fetchZhNames, fetchMonsterList, monsterImg } from '@/services/monster';
import { t } from '@/common/i18n';

const route = useRoute();
const fileRef = ref(null);
const importing = ref(false);
const active = ref(null);
const profiles = ref([]);
const activeId = ref(null);
const meta = ref(null);
const rules = ref(loadRules());
const zhNames = ref(null);
const minList = ref([]);
const rolesDb = ref(null);
const storeOk = ref(true);
const tab = ref('runes');
const selUnit = ref(null);
const detailShow = ref(false);
const guideShow = ref(false);
const detail = ref(null);
const f = reactive({ sets: [], slots: [], starsArr: [], quality: [], ancient: 'all', main: null, advice: null, minEff: 0, exclEquipped: false, exclLocked: false, exclSpeed: false, sort: 'effDesc', kw: '' });
const manualLine = ref(null); // null=自动; 数字=手动线(持久化)
try { const v = Number(localStorage.getItem('sw_rune_line')); if (v > 0) manualLine.value = v; } catch {}
const tableBox = ref(null);
const tableW = ref(1000);

/** stat id -> 英文 slug(与 rune_meta 的 maxRolls 键一致) */
const STAT_SLUG = { 1: 'hp_flat', 2: 'hp_pct', 3: 'atk_flat', 4: 'atk_pct', 5: 'def_flat', 6: 'def_pct', 8: 'spd', 9: 'cr', 10: 'cd', 11: 'res', 12: 'acc' };
const PCT_STATS = new Set(['hp_pct', 'atk_pct', 'def_pct', 'cr', 'cd', 'res', 'acc']);

/** 副属性中文名选项(筛选用): rune_meta.stats 以数字 id 为键, 转 slug 索引 */
const STAT_OPTS = computed(() => {
	const src = meta.value?.stats || {};
	const out = {};
	for (const [id, name] of Object.entries(src)) out[STAT_SLUG[id] || 's' + id] = name;
	return out;
});
const statName = (slug) => STAT_OPTS.value[slug] ?? slug;
const fmtVal = (slug, v) => (PCT_STATS.has(slug) ? `${v}%` : String(v));
const setInfo = (id) => meta.value?.sets?.[String(id)];
const SET_COLORS = ['#8a9ba8', '#7a6ff0', '#4bb3ff', '#e05a5a', '#f08c2e', '#59c15c', '#c9a13b', '#a06fd6', '#2ec4b6', '#d6598f', '#8b6f47', '#6f87d6'];
const setColor = (id) => SET_COLORS[(id - 1) % SET_COLORS.length];
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');
/** 多选 chip 组的选中数组里切换一个值 */
const toggleIn = (arr, v) => {
	const i = arr.indexOf(v);
	if (i >= 0) arr.splice(i, 1);
	else arr.push(v);
};
const lineManual = computed({ get: () => manualLine.value != null, set: (v) => { manualLine.value = v ? (autoLineV.value || 210) : null; try { v ? localStorage.setItem('sw_rune_line', String(manualLine.value)) : localStorage.removeItem('sw_rune_line'); } catch {} } });
const manualLineV = computed({ get: () => manualLine.value ?? autoLineV.value, set: (v) => { manualLine.value = v; try { localStorage.setItem('sw_rune_line', String(v)); } catch {} } });
const WHY_KEYS = { locked: 'rune.whyLocked', pspeed: 'rune.whyPowerSpeed', 'atline': 'rune.whyAtLine', chance: 'rune.whyChance', toofar: 'rune.whyTooFar', 'flat-main': 'rune.whyFlatMain', 'res-main': 'rune.whyResMain', speed: 'rune.whySpeed', line: 'rune.whyLine', gem: 'rune.whyGem', 'not-worth': 'rune.whyNotWorth', 'low-stars': 'rune.whyLowStars' };
const whyText = (r) => {
	const a = r?._adv || (r ? adviceOf(r) : null);
	if (!a) return '';
	const key = WHY_KEYS[a.why];
	const base = key ? t(key, a.rl, a.line, a.potential ?? a.rl) : a.why;
	if (a.plan && (a.verdict === 'gem' || a.verdict === 'sell')) {
		// 扭转后的新属性能否再用增强精炼石加强, 只有七种附属可以
		const hint = GRINDABLE.has(a.plan.to) ? t('rune.planGrindable') : t('rune.planSwapOnly');
		return base + ' · ' + t('rune.planText', statName(a.plan.from), statName(a.plan.to), hint, a.potential);
	}
	return base;
};

// ---- 出售判定: RL分 + 分界线(自动=满级RL的N分位/手动) ----
/** 自动线分位候选(百分数), 持久化 'sw_rune_line_q' */
const LINE_QS = [10, 15, 20, 25, 30, 35, 40, 50];
const lineQ = ref(25);
try {
	const q = Number(localStorage.getItem('sw_rune_line_q'));
	if (LINE_QS.includes(q)) lineQ.value = q;
} catch {}
watch(lineQ, (q) => { try { localStorage.setItem('sw_rune_line_q', String(q)); } catch {} });
const autoLineV = computed(() => autoLine(active.value?.runes || [], meta.value, lineQ.value / 100));
const lineV = computed(() => (manualLine.value != null ? manualLine.value : autoLineV.value));
/** 保留标准: 自动(满级 RL 的 N 分位) | 手动(自填数值) */
const lineMode = computed({ get: () => (manualLine.value != null ? 'manual' : 'auto'), set: (v) => { lineManual.value = v === 'manual'; } });
const LINE_MODES = computed(() => [
	{ value: 'auto', label: t('rune.lineAuto', autoLineV.value) },
	{ value: 'manual', label: t('rune.lineManual') }
]);
const lineRules = computed(() => ({ line: lineV.value, fallbackLine: autoLineV.value }));
const adviceOf = (r) => sellAdvice(r, meta.value, lineRules.value);

// ---- 数据推导 ----
const equippedCount = computed(() => active.value?.runes.filter((r) => r.equipped).length || 0);
/** 品质 = 稀有度(6★传说/5★英雄/4★及以下稀有), 与远古标记正交(5★ 远古仍是英雄品质) */
const QUALITY_FN = {
	legend: (r) => r.stars >= 6,
	hero: (r) => r.stars === 5,
	rare: (r) => r.stars < 5
};
const QUALITY_NAME = computed(() => ({ legend: t('rune.qLegend'), hero: t('rune.qHero'), rare: t('rune.qRare') }));
const QUALITY_COLOR = { legend: '#f0a020', hero: '#8f6fe8', rare: '#4ba3ff' };
/** 远古 chip 组(单选): 不限 / 仅远古 / 非远古 */
const ANCIENT_OPTS = computed(() => [
	{ v: 'all', label: t('rune.filterAncientAll') },
	{ v: 'only', label: t('rune.filterAncientOnly') },
	{ v: 'no', label: t('rune.filterAncientNo') }
]);
/** 排序: 字段(效率/RL) + 方向, 合成 f.sort 键 */
const SORTS = {
	effDesc: (a, b) => b._eff - a._eff,
	effAsc: (a, b) => a._eff - b._eff,
	rlDesc: (a, b) => b._rl - a._rl,
	rlAsc: (a, b) => a._rl - b._rl
};
const sortField = computed({
	get: () => (f.sort.startsWith('eff') ? 'eff' : 'rl'),
	set: (v) => { f.sort = v + (f.sort.endsWith('Asc') ? 'Asc' : 'Desc'); }
});
const sortAsc = computed({
	get: () => f.sort.endsWith('Asc'),
	set: (v) => { f.sort = sortField.value + (v ? 'Asc' : 'Desc'); }
});
/** 判定分布图例(对齐参考站的过线/未过线计数) */
const verdictDist = computed(() => {
	const m = { keep: 0, powerup: 0, gem: 0, sell: 0 };
	for (const r of active.value?.runes || []) m[adviceOf(r).verdict] = (m[adviceOf(r).verdict] || 0) + 1;
	return Object.entries(m).map(([k, n]) => ({ k, n, label: t('rune.advice' + cap(k)) }));
});
const setDist = computed(() => {
	const m = {};
	for (const r of active.value?.runes || []) m[r.setId] = (m[r.setId] || 0) + 1;
	return Object.entries(m)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([id, n]) => ({ id: Number(id), n, name: setInfo(id)?.name || '#' + id }));
});
const effOf = (r) => efficiency(r, meta.value).totalEff;
/** 单条副属性的成长次数上限(1 次初始 + 4 次强化), 抽屉成长当量条的满格刻度 */
const MAX_ROLLS = 5;
const effDetail = computed(() => (detail.value ? efficiency(detail.value, meta.value) : null));
const adviceType = (r) => ({ keep: 'success', sell: 'danger', gem: 'warning', powerup: 'info' }[adviceOf(r).verdict] || 'info');

const filteredRunes = computed(() => {
	const rows = [];
	const kw = (f.kw || '').trim().toLowerCase();
	for (const r of active.value?.runes || []) {
		if (f.sets.length && !f.sets.includes(r.setId)) continue;
		if (f.slots.length && !f.slots.includes(r.slot)) continue;
		if (f.starsArr.length && !f.starsArr.includes(r.stars)) continue;
		if (f.quality.length && !f.quality.some((q) => QUALITY_FN[q]?.(r))) continue;
		if (f.ancient === 'only' && !r.ancient) continue;
		if (f.ancient === 'no' && r.ancient) continue;
		if (f.main && r.main.stat !== f.main) continue;
		const a = adviceOf(r);
		if (f.advice && a.verdict !== f.advice) continue;
		if (f.exclLocked && r.locked) continue;
		if (f.exclEquipped && r.equipped) continue;
		if (f.exclSpeed && a.why === 'speed') continue;
		const eff = efficiency(r, meta.value).totalEff;
		if (eff < f.minEff) continue;
		if (kw) {
			const hay = [
				setInfo(r.setId)?.name,
				statName(r.main?.stat),
				...(r.subs || []).map((s) => statName(s.stat) + ' ' + fmtVal(s.stat, s.value))
			].join(' ').toLowerCase();
			if (!hay.includes(kw)) continue;
		}
		rows.push({ ...r, _eff: eff, _rl: a.rl, _advice: a.verdict, _adv: a });
	}
	return rows.sort(SORTS[f.sort] || SORTS.effDesc);
});
/** 筛选结果的线上/线下计数(图例) */
const aboveLineCount = computed(() => filteredRunes.value.filter((r) => r._rl >= lineV.value).length);
const belowLineCount = computed(() => filteredRunes.value.length - aboveLineCount.value);

// ---- 魔灵映射(zh_names 中文名 + min 列表头像) ----
const unitName = (masterId) => {
	if (zhNames.value?.[masterId]?.n) return zhNames.value[masterId].n;
	const it = minList.value.find((x) => x.id === masterId);
	return it?.name || `#${masterId}`;
};
const unitNameById = (unitId) => {
	const u = active.value?.monsters.find((x) => x.unitId === unitId);
	return u ? unitName(u.masterId) : '';
};
const unitImg = (masterId) => {
	const it = minList.value.find((x) => x.id === masterId);
	return it ? monsterImg(it.image) : '';
};
const unitRoles = (masterId) => rolesDb.value?.[String(masterId)] || [];
/** 定位 -> 建议属性(slug) 简表 */
const ROLE_STATS = {
	atk_booster: [], atb_reducer: ['res', 'acc'], atb_booster: ['spd'], healer: ['hp_pct', 'res'],
	cleanser: ['res'], stripper: ['acc'], freeze: ['acc'], stun: ['acc'], sleep: ['acc'], provoke: ['res'],
	slow: ['acc'], shielder: [], invincible: ['res'], brander: ['acc'], glancing: ['acc'], silence: ['acc']
};
const sugStats = computed(() => {
	const set = new Set();
	for (const r of unitRoles(selUnit.value?.masterId)) for (const s of ROLE_STATS[r] || []) set.add(s);
	return [...set].map((s) => statName(s));
});
const buildRunes = computed(() =>
	(active.value?.runes || []).filter((r) => r.equipped === selUnit.value?.unitId).sort((a, b) => a.slot - b.slot)
);

// ---- 导入/存档 ----
const pickFile = () => fileRef.value?.click();
const onFile = async (e) => {
	const file = e.target.files?.[0];
	e.target.value = '';
	if (!file) return;
	importing.value = true;
	try {
		const parsed = await parseProfile(file);
		if (!parsed.ok) {
			ElMessage.error(t(parsed.reason === 'not_swex' ? 'rune.notSwex' : 'rune.badFile'));
			return;
		}
		const rec = {
			id: `${parsed.wizard.id}-${Date.now()}`,
			name: parsed.wizard.name,
			wizard: parsed.wizard,
			monsters: parsed.monsters,
			runes: parsed.runes,
			artifacts: parsed.artifacts,
			lockedIds: parsed.lockedIds ? [...parsed.lockedIds] : [],
			warnings: parsed.warnings || [],
			savedAt: Date.now()
		};
		const saved = await saveProfile(rec);
		await setActive(saved.id);
		active.value = saved;
		activeId.value = saved.id;
		storeOk.value = isAvailable;
		profiles.value = await listProfiles();
		ElMessage.success(t('rune.savedOk'));
		if (rec.warnings?.length) ElMessage.warning(t('rune.warnings', rec.warnings.length));
	} catch (err) {
		if (err?.message === 'profile_too_large') ElMessage.error(t('rune.tooLarge'));
		else ElMessage.error(String(err?.message || err));
	} finally {
		importing.value = false;
	}
};
const onSwitchProfile = async (id) => {
	await setActive(id);
	active.value = await getProfile();
	selUnit.value = null;
};
const onDelete = async () => {
	try {
		await ElMessageBox.confirm(t('rune.deleteConfirm'), { type: 'warning' });
	} catch { return; }
	await deleteProfile(activeId.value);
	profiles.value = await listProfiles();
	active.value = await getActive();
	activeId.value = active.value?.id || null;
};

// ---- 表格列(el-table-v2 cellRenderer) ----
const adviceTag = (a) => h('span', { class: 'adv_tag ' + a }, t('rune.advice' + cap(a)));
const subsCell = ({ rowData: r }) =>
	h('div', { class: 'subs_cell' },
		r.subs.map((s, i) =>
			h('span', { key: i, class: 'sub_item' }, [
				`${statName(s.stat)} ${fmtVal(s.stat, s.value)}`,
				s.grind ? h('b', { class: 'grind' }, `+${fmtVal(s.stat, s.grind)}`) : null,
				s.gem ? h('i', { class: 'gem' }, '◆') : null
			])
		));
const columns = [
	{ key: 'slot', dataKey: 'slot', title: t('rune.colSlot'), width: 60, cellRenderer: ({ cellData: v }) => h('b', {}, String(v)) },
	{ key: 'set', dataKey: 'setId', title: t('rune.colSet'), width: 110, cellRenderer: ({ cellData: v }) => h('span', { class: 'set_cell' }, [h('i', { style: { background: setColor(v) } }), setInfo(v)?.name || '#' + v]) },
	{ key: 'stars', dataKey: 'stars', title: t('rune.colStars'), width: 110, cellRenderer: ({ rowData: r }) => h('span', {}, `${r.ancient ? t('rune.ancientTag') + ' ' : ''}${r.stars}★+${r.level}`) },
	{ key: 'main', dataKey: 'main', title: t('rune.colMain'), width: 120, cellRenderer: ({ cellData: m }) => h('span', {}, `${statName(m.stat)} ${fmtVal(m.stat, m.value)}`) },
	{ key: 'subs', dataKey: 'subs', title: t('rune.colSubs'), width: 360, cellRenderer: subsCell },
	{ key: 'rl', dataKey: '_rl', title: t('rune.colRl'), width: 80, cellRenderer: ({ cellData: v }) => h('b', { class: 'eff_num' }, String(v)) },
	{ key: 'eff', dataKey: '_eff', title: t('rune.colEff'), width: 90, cellRenderer: ({ cellData: v }) => h('span', { class: 'eff_txt' }, v.toFixed(1) + '%') },
	{ key: 'advice', dataKey: '_advice', title: t('rune.colAdvice'), width: 90, cellRenderer: ({ cellData: v }) => adviceTag(v) }
];
const rowClass = ({ rowIndex }) => (rowIndex % 2 ? 'odd_row' : '');
/** el-table-v2 不 emit row-click, 行事件须经 row-event-handlers prop 传入({ event, rowData, rowIndex, rowKey }) */
const rowHandlers = { onClick: ({ rowData }) => openDetail(rowData) };
/** 打开符文详情(表格行 / 构建卡片共用) */
const openDetail = (r) => {
	if (!r?.slot || !r?.main) return;
	detail.value = r;
	detailShow.value = true;
};
const onImgErr = (e) => { e.target.style.visibility = 'hidden'; };
const onResize = () => { if (tableBox.value) tableW.value = tableBox.value.clientWidth; };

watch(tab, () => setTimeout(onResize, 0));

onMounted(async () => {
	window.addEventListener('resize', onResize);
	// 元数据与映射并行加载(失败不阻塞页面, 对应板块回退英文/空)
	const [m, zh, list, roles] = await Promise.all([
		fetchRuneMeta().catch(() => null),
		fetchZhNames().catch(() => null),
		fetchMonsterList().catch(() => []),
		fetch(`${import.meta.env.BASE_URL}sw/roles.json`).then((r) => r.json()).catch(() => null)
	]);
	meta.value = m;
	zhNames.value = zh;
	minList.value = list;
	rolesDb.value = roles;
	storeOk.value = isAvailable;
	profiles.value = await listProfiles().catch(() => []);
	active.value = await getActive().catch(() => null);
	activeId.value = active.value?.id || null;
	setTimeout(onResize, 50);
	// 详情页跳转预选: /rune?unit=<masterId>
	if (route.query.unit) {
		const u = active.value?.monsters.find((x) => String(x.masterId) === String(route.query.unit));
		if (u) { tab.value = 'monsters'; selUnit.value = u; }
	}
});
onBeforeUnmount(() => window.removeEventListener('resize', onResize));
</script>

<style lang="less" scoped>
.rune_workbench {
	padding: 16px 20px 32px;
	background-color: #f5f7fa;
	min-height: 100%;

	.wb_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		.wb_title { font-size: 18px; font-weight: 600; color: #303133; }
		.wb_actions { display: flex; gap: 8px; }
	}

	.empty_card {
		padding: 22px 24px 26px;
		.empty_head {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 16px;
			max-width: 780px;
			margin: 0 auto 18px;
			padding-bottom: 16px;
			border-bottom: 1px solid #f0f2f5;
			.empty_title { font-size: 17px; font-weight: 600; color: #303133; }
		}
		.swex_tip { margin: 4px 0 0; font-size: 13px; color: #909399; line-height: 1.7; }
	}

	.storage_warn {
		background: #fdf6ec;
		color: #e6a23c;
		border: 1px solid #faecd8;
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 12px;
		margin-bottom: 10px;
	}

	.wb_head_card {
		background: #fff;
		border-radius: 8px;
		padding: 14px 18px 12px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		margin-bottom: 12px;
		.hc_row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			flex-wrap: wrap;
			gap: 10px 20px;
			&.legend_row { margin-top: 12px; }
		}
		.hc_stat { display: flex; align-items: baseline; gap: 12px; }
		.hc_num { font-size: 20px; font-weight: 700; color: #303133; }
		.hc_sub { font-size: 12px; color: #909399; }
		.hc_ctl {
			display: flex;
			align-items: center;
			gap: 10px;
			font-size: 13px;
			color: #606266;
			.hc_ctl_icon { color: #e6a23c; font-size: 15px; }
			.hc_line_input { width: 110px; }
			.hc_q_select { width: 170px; }
		}
		.hc_legend { display: flex; flex-wrap: wrap; gap: 8px; }
		.hc_sets {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 4px 12px;
			margin-left: auto;
			font-size: 12px;
			color: #606266;
			.hc_sets_lbl { color: #909399; }
		}
	}
	.set_chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		i { width: 8px; height: 8px; border-radius: 50%; }
	}
	.adv_chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		padding: 2px 10px;
		border-radius: 12px;
		b { font-weight: 700; }
		i { width: 8px; height: 8px; border-radius: 50%; }
		&.keep { background: #f0f9eb; color: #529b2e; i { background: #67c23a; } }
		&.powerup { background: #ecf5ff; color: #337ecc; i { background: #409eff; } }
		&.gem { background: #fdf6ec; color: #b88230; i { background: #e6a23c; } }
		&.sell { background: #fef0f0; color: #c45656; i { background: #f56c6c; } }
	}

	.filter_area {
		background: #fff;
		border-radius: 8px;
		padding: 16px 18px 12px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		margin-bottom: 12px;
		.f_row {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 12px 14px;
			margin-bottom: 12px;
		}
		.chip_group {
			position: relative;
			display: inline-flex;
			align-items: center;
			gap: 2px;
			padding: 6px;
			border: 1px solid #dcdfe6;
			border-radius: 10px;
			background: #fff;
			.gl {
				position: absolute;
				top: -9px;
				left: 10px;
				padding: 0 4px;
				font-size: 12px;
				line-height: 16px;
				color: #909399;
				background: #fff;
			}
		}
		.chip {
			height: 28px;
			min-width: 34px;
			padding: 0 10px;
			border: 1px solid transparent;
			border-radius: 7px;
			background: transparent;
			color: #606266;
			font-size: 13px;
			font-family: inherit;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 5px;
			cursor: pointer;
			transition: background-color 0.15s, border-color 0.15s, color 0.15s;
			&:hover { background: #f5f7fa; }
			&.on { background: #ecf5ff; border-color: #c6e2ff; color: #409eff; font-weight: 600; }
			&.num { min-width: 30px; padding: 0 8px; }
		}
		.qdot { width: 8px; height: 8px; border-radius: 50%; }
		.w_set { width: 140px; }
		.w_main { width: 140px; }
		.w_advice { width: 116px; }
		.w_eff { width: 110px; }
		.w_sort_field { width: 100px; }
		.eff_filter {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			font-size: 14px;
			color: #606266;
		}
		.excl_group {
			display: inline-flex;
			gap: 8px;
			margin-left: auto;
		}
		.pill {
			height: 32px;
			padding: 0 12px 0 8px;
			border: 1px solid #dcdfe6;
			border-radius: 8px;
			background: #fff;
			color: #606266;
			font-size: 13px;
			font-family: inherit;
			display: inline-flex;
			align-items: center;
			gap: 5px;
			cursor: pointer;
			transition: background-color 0.15s, border-color 0.15s, color 0.15s;
			.el-icon { font-size: 14px; color: #909399; }
			&:hover { border-color: #c0c4cc; }
			&.on {
				background: #fdf6ec;
				border-color: #f3d19e;
				color: #e6a23c;
				.el-icon { color: #e6a23c; }
			}
		}
		.search_row {
			.search_input { flex: 1; min-width: 240px; }
		}
		.result_bar {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 6px 20px;
			padding-top: 10px;
			border-top: 1px solid #f0f2f5;
			font-size: 13px;
			color: #606266;
			.rb_count { font-weight: 600; color: #303133; }
			.rb_legend { display: inline-flex; gap: 16px; }
			.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
			.above { background: #67c23a; }
			.below { background: #c0c4cc; }
		}
	}

	.table_box { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06); }

	.mon_layout {
		display: grid;
		grid-template-columns: 260px minmax(0, 1fr);
		gap: 12px;
		align-items: start;
	}
	.mon_list {
		background: #fff;
		border-radius: 8px;
		padding: 8px;
		max-height: 640px;
		overflow-y: auto;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		.mon_item {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding: 6px 4px;
			border-radius: 8px;
			cursor: pointer;
			&:hover { background: #f5f7fa; }
			&.sel { background: #ecf5ff; outline: 1px solid #b3d8ff; }
			img { width: 44px; height: 44px; object-fit: contain; }
			.mon_name { font-size: 12px; color: #303133; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
			.mon_lv { font-size: 11px; color: #909399; }
		}
	}
	.mon_build {
		background: #fff;
		border-radius: 8px;
		padding: 14px;
		.build_head {
			display: flex;
			align-items: center;
			gap: 10px;
			margin-bottom: 8px;
			b { font-size: 16px; }
			.role_row { display: flex; gap: 4px; flex-wrap: wrap; }
		}
		.sug_row {
			display: flex;
			align-items: center;
			gap: 6px;
			flex-wrap: wrap;
			margin-bottom: 10px;
			.sug_label { font-size: 12px; color: #909399; }
			.sug_chip { font-size: 12px; background: #f0f9eb; color: #67c23a; border-radius: 10px; padding: 2px 10px; }
		}
		.build_title { font-size: 13px; font-weight: 600; color: #606266; margin-bottom: 8px; }
	}
	.rune_cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		.rune_card {
			border: 1px solid #ebeef5;
			border-radius: 8px;
			padding: 8px 10px;
			cursor: pointer;
			&:hover { border-color: #c6e2ff; }
			&.empty_slot {
				display: flex;
				align-items: center;
				justify-content: center;
				color: #dcdfe6;
				font-size: 28px;
				min-height: 120px;
				cursor: default;
			}
			.rc_top { display: flex; gap: 6px; align-items: center; font-size: 12px; margin-bottom: 4px;
				.rc_slot { background: #303133; color: #fff; border-radius: 4px; padding: 0 6px; }
				.rc_set { font-weight: 600; color: #303133; }
				.rc_stars { color: #d9a521; margin-left: auto; } }
			.rc_main { font-size: 13px; color: #409eff; margin-bottom: 4px; }
			.rc_subs { font-size: 12px; color: #606266; line-height: 1.8;
				.grind { color: #67c23a; font-weight: 600; }
				.gem { color: #e6a23c; font-style: normal; margin-left: 2px; } }
			.rc_eff { margin-top: 4px; font-size: 12px; color: #909399; }
		}
	}

	.dt_head { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; font-size: 15px; }
	.dt_tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
	.dt_why { flex-basis: 100%; margin-top: 4px; font-size: 12px; color: #606266; line-height: 1.6; }
	.dt_row {
		display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px;
		&.main b { color: #409eff; }
		&.innate b { color: #e6a23c; }
		&.eff {
			margin-top: 6px; padding-top: 8px; border-top: 1px dashed #ebeef5;
			b { color: #303133; font-size: 15px; }
		}
	}
	.dt_section { font-size: 12px; color: #909399; margin: 10px 0 6px; font-weight: 600; }
	.dt_roll {
		display: grid; grid-template-columns: 64px 1fr 44px; gap: 8px; align-items: center; padding: 3px 0; font-size: 12px;
		.dr_bar { background: #f0f2f5; border-radius: 4px; height: 8px; overflow: hidden;
			.dr_fill { height: 100%; background: #a0cfff; border-radius: 4px; &.max { background: #67c23a; } } }
		.dr_pct { text-align: right; color: #606266; }
	}
	.dt_formula { margin-top: 12px; font-size: 12px; color: #909399; line-height: 1.6; }
	.dt_formula.dt_breakdown { margin-top: 2px; }
}

:deep(.adv_tag) {
	border-radius: 10px;
	padding: 1px 10px;
	font-size: 12px;
	&.keep { background: #f0f9eb; color: #67c23a; }
	&.sell { background: #fef0f0; color: #f56c6c; }
	&.consider { background: #f4f4f5; color: #909399; }
	&.gem { background: #fdf6ec; color: #e6a23c; }
	&.powerup { background: #ecf5ff; color: #409eff; }
}
:deep(.set_cell) {
	display: inline-flex;
	align-items: center;
	gap: 5px;
	i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
}
:deep(.subs_cell) {
	display: flex;
	flex-wrap: wrap;
	gap: 4px 10px;
	.sub_item { font-size: 12px; color: #606266; white-space: nowrap; }
	.grind { color: #67c23a; }
	.gem { color: #e6a23c; font-style: normal; }
}
// SWEX 指南居中弹窗: 正文限高滚动
.guide_body {
	max-height: 64vh;
	overflow-y: auto;
}
:deep(.el-table-v2__row) { cursor: pointer; }
:deep(.eff_num) { color: #303133; }
</style>
