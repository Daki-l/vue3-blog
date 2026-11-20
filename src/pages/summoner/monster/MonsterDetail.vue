<template>
	<div class="monster_detail" v-loading="onLoading">
		<div class="detail_header">
			<el-button link @click="goBack">
				<span class="back_arrow">←</span> {{ t('common.back') }}
			</el-button>
			<span class="detail_title">{{ T(m.zh?.name, m.name) || t('monster.detail') }}</span>
		</div>

		<template v-if="m && m.com2us_id">
			<div class="detail_cols">
				<!-- 左栏:单面板,分区以间距+细线控制(省空间) -->
				<div class="left_col">
					<div class="left_panel" :style="{ borderTopColor: elementMeta(m.element).color }">
						<div class="panel_portrait">
							<img class="elem_mark" :src="elementIconUrl(m.element)" :alt="m.element" />
							<img class="big_img" :src="monsterImg(m.image, true)" :alt="m.name" @error="imgFallback" />
							<div class="stars_row">{{ '★'.repeat(m.natural_stars) }}</div>
							<div class="elem_line">
								<img class="elem_icon" :src="elementIconUrl(m.element)" />
								<span>{{ t('monster.elementAttr', elementMeta(m.element).label) }} · {{ archetypeLabel(m.archetype) }}</span>
							</div>
						</div>

						<!-- 基础信息 -->
						<div class="panel_sec">
							<div class="sec_label">{{ t('monster.basicInfo') }}</div>
							<div class="meta_row"><span>{{ t('monster.archetype') }}</span><b>{{ archetypeLabel(m.archetype) }}</b></div>
							<div class="meta_row"><span>{{ t('monster.family') }}</span><b>{{ T(m.zh?.family, m.family) }}</b></div>
							<div class="meta_row" v-if="m.unawakened_name && m.unawakened_name !== m.name"><span>{{ t('monster.unawakened') }}</span><b>{{ T(m.zh?.family, m.unawakened_name) }}</b></div>
							<div class="meta_row" v-if="m.collab"><span>{{ t('monster.collab') }}</span><b>{{ m.collab }}</b></div>
							<div class="bonus_line leader" v-if="m.leader_skill && m.leader_skill.text">
								<img class="leader_icon" :src="leaderIconUrl(m.leader_skill.icon)" v-if="m.leader_skill.icon" />
								<span><b>{{ t('monster.leaderSkill') }}</b> {{ T(m.zh?.leader_skill, m.leader_skill.text) }}</span>
							</div>
							<div class="bonus_line" v-if="m.awaken_bonus"><span><b>{{ t('monster.awakenBonus') }}</b> {{ T(m.zh?.awaken_bonus, m.awaken_bonus) }}</span></div>
						</div>

						<!-- 基础属性:三列,仅最低~最高(原站口径) -->
						<div class="panel_sec">
							<div class="sec_label">{{ t('monster.baseStats') }}</div>
							<div class="stat_mini_grid">
								<div class="stat_mini" v-for="key in statKeys" :key="key">
									<span class="sm_label">{{ statLabel(key) }}</span>
									<span class="sm_value">{{ fmtRange(m.stats?.[key]) }}</span>
								</div>
							</div>
						</div>

						<!-- 觉醒形态:带进阶箭头 -->
						<div class="panel_sec" v-if="forms.length">
							<div class="sec_label">{{ t('monster.awakenForms') }}</div>
							<div class="forms_row">
								<template v-for="(f, i) in forms" :key="f.id">
									<div
										class="form_item"
										:class="{ current: f.id === m.com2us_id, off: !f.linked }"
										:title="f.linked ? t('monster.formTitle', f.name, f.id) : t('monster.notLinked', f.id)"
										@click="f.linked && f.id !== m.com2us_id && goDetail(f.id)">
										<img :src="monsterImg(f.image)" loading="lazy" @error="imgFallback" />
										<span class="stage_n">{{ i + 1 }}</span>
									</div>
									<span v-if="i < forms.length - 1" class="form_arrow">→</span>
								</template>
							</div>
						</div>

						<!-- 同族元素切换(方形瓦片 + 官方元素图标角标) -->
						<div class="panel_sec" v-if="siblings.length">
							<div class="sec_label">{{ t('monster.sameFamily') }}</div>
							<div class="sib_row">
								<div
									v-for="s in siblings"
									:key="s.id"
									class="sib_item"
									:class="{ current: s.id === m.com2us_id }"
									:title="t('monster.sibTitle', s.name, elementMeta(s.element).label)"
									@click="s.id !== m.com2us_id && goDetail(s.id)">
									<img :src="monsterImg(s.image)" loading="lazy" />
									<img class="sib_elem" :src="elementIconUrl(s.element)" :alt="s.element" />
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- 右栏:技能 + 平衡补丁(属性已移左栏) -->
				<div class="right_col">
					<div class="section_card" v-for="(s, i) in m.skills || []" :key="s.slot">
						<div class="skill_head">
							<img class="skill_icon" :src="skillIconUrl(s.icon)" v-if="s.icon" @error="imgFallback" />
							<div class="skill_head_texts">
								<div class="skill_name_row">
									<span class="skill_slot">{{ t('monster.skill', s.slot) }}</span>
									<span class="skill_name">{{ T(m.zh?.skills?.[i]?.name, s.name) }}</span>
									<span class="skill_lv" v-if="s.level_text">{{ s.level_text }}</span>
								</div>
								<div class="skill_sub" v-if="s.multiplier">
									{{ t('monster.multiplier') }}<code>{{ s.multiplier }}</code>
									<template v-if="s.scales_with && s.scales_with.length"> · {{ t('monster.scalesWith') }} {{ s.scales_with.join(' / ') }}</template>
								</div>
							</div>
						</div>
						<p class="skill_desc">{{ T(m.zh?.skills?.[i]?.description, s.description) }}</p>
						<!-- 效果:有图标仅显图(悬停说明),无图标回落文本 pill -->
						<div class="effect_row" v-if="effListOf(s).length">
							<span
								v-for="(ef, j) in effListOf(s)"
								:key="j"
								class="eff_chip"
								:class="ef.type"
								:title="ef.name + (ef.desc ? '\n' + ef.desc : '')">
								<img v-if="ef.icon" :src="effectIconUrl(ef.icon)" />
								<span v-else class="eff_name">{{ ef.name }}</span>
							</span>
						</div>
						<div class="skillup_box" v-if="s.skillups && s.skillups.length">
							<div class="skillup_title">{{ t('monster.skillups') }}</div>
							<div class="skillup_item" v-for="su in s.skillups" :key="su.n">
								<span class="su_n">+{{ su.n }}</span>
								<span>{{ T(m.zh?.skills?.[i]?.skillups?.[su.n - 1]?.text, su.text) }}</span>
							</div>
						</div>
					</div>

					<!-- 平衡补丁时间线 -->
					<div class="section_card" v-if="balanceList.length">
						<div class="section_title">{{ t('monster.balanceTitle') }}<span class="section_count">{{ balanceList.length }}</span></div>
						<div class="bal_item" v-for="(b, i) in shownBalance" :key="i">
							<span class="bal_date">{{ b.date }}</span>
							<span class="bal_badge" :class="balClass(b.changeType)">{{ balTypeLabel(b.changeType) }}</span>
							<span class="bal_skill" v-if="b.skillName">{{ b.slot }} {{ balSkillName(b) }}</span>
							<span class="bal_text">{{ b.text }}</span>
						</div>
						<div class="bal_more" v-if="balanceList.length > 5" @click="showAllBalance = !showAllBalance">
							{{ showAllBalance ? t('monster.collapse') : t('monster.showAll', balanceList.length) }}
						</div>
					</div>
				</div>
			</div>

			<!-- 底部 3v3 参战区(静态索引:参与的防守 + 作为克制出现) -->
			<div class="section_card pvp3_section">
				<div class="section_title">
					{{ t('monster.pvp3Title') }}
					<span class="section_count">{{ t('monster.pvp3Desc') }}</span>
				</div>
				<template v-if="pvp3">
					<div class="pvp3_block" v-if="pvp3.defenses.length">
						<div class="pvp3_sub">{{ t('pvp.inDefense') }} · {{ pvp3.defenses.length }}</div>
						<div class="pvp3_teams">
							<div v-for="k in pvp3.defenseRows.slice(0, pvp3ShowAllD ? 100 : 6)" :key="k.k" class="pvp3_team" @click="router.push(`/3v3/${k.k}`)">
								<img v-for="mm in k.monsters" :key="mm.id" :src="monsterImg(mm.image)" :title="pick(monsterZh(mm.id), mm.name)" />
							</div>
							<div class="pvp3_more" v-if="pvp3.defenses.length > 6" @click="pvp3ShowAllD = !pvp3ShowAllD">
								{{ pvp3ShowAllD ? '−' : '+' + (pvp3.defenses.length - 6) }}
							</div>
						</div>
					</div>
					<div class="pvp3_block" v-if="pvp3.counters.length">
						<div class="pvp3_sub">{{ t('pvp.asCounter') }} · {{ pvp3.counters.length }}</div>
						<div class="pvp3_teams">
							<div v-for="(c, i) in pvp3.counters.slice(0, pvp3ShowAllC ? 100 : 6)" :key="i" class="pvp3_team" @click="router.push(`/3v3/${c.k}`)">
								<img v-for="id in c.m" :key="id" :src="pvp3Icon(id)" :title="pick(monsterZh(id), monsterName(id))" :class="{ me: id === m.com2us_id }" />
							</div>
							<div class="pvp3_more" v-if="pvp3.counters.length > 6" @click="pvp3ShowAllC = !pvp3ShowAllC">
								{{ pvp3ShowAllC ? '−' : '+' + (pvp3.counters.length - 6) }}
							</div>
						</div>
					</div>
					<div class="pvp3_empty" v-if="!pvp3.defenses.length && !pvp3.counters.length">{{ t('pvp.no3mdc') }}</div>
				</template>
				<div class="pvp3_placeholder" v-else>
					<div class="ph_team" v-for="n in 3" :key="n">
						<span class="ph_slot" v-for="k in 3" :key="k"></span>
					</div>
					<p class="ph_text">{{ t('monster.pvp3Placeholder') }}</p>
				</div>
			</div>
		</template>
		<el-empty v-else-if="!onLoading" :description="t('monster.notFound')" :image-size="90" />
	</div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
	fetchMonster, fetchMonsterList, fetchZhNames, fetchZhSkills, fetchForms, fetchBalanceDb, monsterImg, skillIconUrl, leaderIconUrl, effectIconUrl,
	elementIconUrl, elementMeta, archetypeLabel, pick, statLabel
} from '@/services/monster';
import { t, isZh } from '@/common/i18n';
import { fetchMonster3mdc, fetchDefense } from '@/services/3mdc';

const route = useRoute();
const router = useRouter();

const m = ref({});
const minList = ref([]);
const formsDb = ref(null);
const onLoading = ref(false);
const showAllBalance = ref(false);
const T = pick;

// ---- 3v3 参战(静态索引) ----
const pvp3 = ref(null);
const pvp3ShowAllD = ref(false);
const pvp3ShowAllC = ref(false);
const monsterName = (id) => minList.value.find((x) => x.id === id)?.name ?? '';
const monsterZh = (id) => (isZh() ? monsterName(id) : '');
const pvp3Icon = (id) => {
	const it = minList.value.find((x) => x.id === id);
	return it ? monsterImg(it.image) : '';
};
async function loadPvp3(id) {
	pvp3.value = null;
	pvp3ShowAllD.value = false;
	pvp3ShowAllC.value = false;
	try {
		const idx = await fetchMonster3mdc(id);
		if (!idx) { pvp3.value = { defenses: [], counters: [], defenseRows: [] }; return; }
		// 防守 key -> 首屏需要魔灵图标:取前若干条详情(其余点进详情页看)
		const rows = await Promise.all(idx.defenses.slice(0, 100).map(async (k) => {
			const d = await fetchDefense(k);
			return d ? { k, monsters: d.monsters } : null;
		}));
		pvp3.value = {
			defenses: idx.defenses,
			defenseRows: rows.filter(Boolean),
			counters: idx.counters
		};
	} catch {
		pvp3.value = { defenses: [], counters: [], defenseRows: [] };
	}
}

const statKeys = ['hp', 'atk', 'def', 'spd', 'cr', 'cd', 'res', 'acc', 'skillups'];

const fmtStat = (s) => (s ? s.value + (s.isPercent ? '%' : '') : '-');
/** 原站口径:仅最低~最高 */
const fmtRange = (s) => (s ? `${s.min}~${s.max}${s.isPercent ? '%' : ''}` : '-');

/** 觉醒形态:上游 forms 或本地形态库 awakening_chain; 可点 = min 列表或形态库存在 */
const forms = computed(() => {
	const raw = (m.value.forms || []).length
		? m.value.forms
		: (m.value.awakening_chain || []).map((id) => ({ id }));
	const idx = {};
	for (const it of minList.value) idx[it.id] = it;
	return raw.map((f) => {
		const local = formsDb.value?.[f.id];
		const name = idx[f.id]?.name || (isZh() ? local?.zh_name || local?.name : local?.name) || '';
		// 图源优先级: 上游 forms 自带 > 形态库(swarfarm 文件名) > 列表(链尾最终形态)
		return { ...f, image: f.image || local?.image || idx[f.id]?.image || '', linked: !!(idx[f.id] || local), name };
	});
});

/** 同族元素快切:同 family 各元素取一个(优先本只) */
const siblings = computed(() => {
	if (!m.value.family) return [];
	const byElement = {};
	for (const it of minList.value) {
		if (it.family !== m.value.family) continue;
		if (!byElement[it.element] || it.id === m.value.com2us_id) byElement[it.element] = it;
	}
	return Object.values(byElement);
});

/** 技能效果:增强数据(图标/文本/类型)优先,无则回落旧文本数组 */
const effListOf = (s) => {
	if (s.effect_icons && s.effect_icons.length) return s.effect_icons;
	return (s.effects || []).map((e) => ({ name: String(e).split(/\s+/)[0], desc: String(e), type: 'other' }));
};

const balanceList = computed(() => m.value.balance || []);
const shownBalance = computed(() => (showAllBalance.value ? balanceList.value : balanceList.value.slice(0, 5)));
const balClass = (t) => {
	if (/Increas|Added|buff/i.test(t)) return 'up';
	if (/Decreas|Removed|nerf/i.test(t)) return 'down';
	return 'mid';
};
/** 补丁类型中文(未收录类型回退原文) */
const balTypeLabel = (v) => {
	const key = 'monster.balType.' + v;
	const hit = t(key);
	return hit === key ? v : hit;
};
/** 补丁记录里的技能名 -> 本魔灵中文技能名(按英文名对齐槽位) */
const balSkillName = (b) => {
	if (!isZh() || !b.skillName) return b.skillName;
	const i = (m.value.skills || []).findIndex((s) => s.name === b.skillName);
	return (i >= 0 ? m.value.zh?.skills?.[i]?.name : '') || b.skillName;
};

const goBack = () => {
	if (window.history.state && window.history.state.back) router.back();
	else router.push('/monster');
};
const goDetail = (id) => router.push(`/monster/${id}`);

/** 图源回退: 本站静态库缺少部分形态皮肤图/形态技能图标, 失败时换 swarfarm 同名图 */
const imgFallback = (e) => {
	const img = e.target;
	if (img.dataset.fb) return;
	img.dataset.fb = '1';
	const file = (img.src || '').split('/').pop();
	if (!file) return;
	img.src = img.src.includes('/skills/')
		? `https://swarfarm.com/static/herders/images/skills/${file}`
		: `https://swarfarm.com/static/herders/images/monsters/${file}`;
};

const load = async (id) => {
	onLoading.value = true;
	m.value = {};
	try {
		const [detail, list, zhAll, zhNames, formsMap, balanceDb] = await Promise.all([
			fetchMonster(id),
			fetchMonsterList().catch(() => []),
			fetchZhSkills().catch(() => null),
			fetchZhNames().catch(() => null),
			fetchForms().catch(() => null),
			fetchBalanceDb().catch(() => null)
		]);
		m.value = detail || {};
		formsDb.value = formsMap;
		// 平衡补丁: 本地库(swlens 端点全量爬取)优先, 上游详情内嵌记录已过时;
		// 本地形态(未觉醒/一觉)继承觉醒链最终形态的补丁史(同族技能演进)
		const balId = balanceDb?.[id]?.length
			? id
			: (detail?._localForm ? (detail.awakening_chain || []).slice(-1)[0] : null);
		if (balId && balanceDb?.[balId]?.length) m.value.balance = balanceDb[balId];
		// 简中覆盖层(本地库, 缺省字段经模板 pick 回退英文); 英文语言不叠加。
		if (isZh()) {
			const zid = detail?.com2us_id;
			let zh = zhAll?.[zid];
			// 未觉醒/一觉形态(本地形态库): 技能中文继承觉醒链最终形态(同族技能族内一致, 按槽位对齐)
			if (!zh && zid && detail?._localForm) {
				const chain = detail.awakening_chain || [];
				const zhFinal = chain.length ? zhAll?.[chain[chain.length - 1]] : null;
				if (zhFinal?.skills?.length) {
					zh = {
						name: detail.zh_name || zhFinal.name,
						family: detail.zh_family || zhFinal.family,
						skills: (detail.skills || [])
							.map((s) => zhFinal.skills[(s.slot || 0) - 1])
							.filter(Boolean)
					};
				}
			}
			// 名称以官方字典刷新后的 zh_names 为准(zh_skills 内嵌名可能为旧译)
			if (zh && zhNames?.[zid]?.n) zh = { ...zh, name: zhNames[zid].n, family: zhNames[zid].f || zh.family };
			m.value.zh = zh || (detail?.zh_name ? { name: detail.zh_name, family: detail.zh_family } : null);
		}
		// min 列表名同步中文化(觉醒形态/同族切换提示)
		if (zhNames && isZh()) {
			for (const it of list) {
				const z = zhNames[it.id];
				if (z?.n) it.name = z.n;
			}
		}
		minList.value = list;
	} catch (e) {
		console.error('获取魔灵详情失败', e);
	} finally {
		onLoading.value = false;
	}
};

onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => id && load(id));
watch(() => m.value.com2us_id, (id) => id && loadPvp3(id), { immediate: true });
</script>

<style lang="less">
.monster_detail {
	padding: 20px 24px 32px;
	background-color: #f5f7fa;
	min-height: 100%;

	.detail_header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 14px;
		.back_arrow { font-weight: 600; }
		.detail_title { font-size: 18px; font-weight: 600; color: #303133; }
	}

	.detail_cols {
		display: grid;
		grid-template-columns: 300px minmax(0, 1fr);
		gap: 12px;
		align-items: start;
	}

	/* ===== 左栏:单面板,分区用间距+细线 ===== */
	.left_col {
		position: sticky;
		top: 12px;
	}
	.left_panel {
		position: relative;
		background: #ffffff;
		border-radius: 10px;
		border-top: 4px solid #909399;
		padding: 12px 14px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
	}
	.panel_portrait {
		text-align: center;
		position: relative;
		.big_img { width: 118px; height: 118px; object-fit: contain; }
		.stars_row { color: #d9a521; letter-spacing: 3px; font-size: 13px; margin-top: 0; }
		.elem_mark {
			position: absolute;
			top: -2px;
			right: 0;
			width: 22px;
			height: 22px;
			object-fit: contain;
		}
		.elem_line {
			display: inline-flex;
			align-items: center;
			gap: 5px;
			font-size: 12px;
			color: #606266;
			background: #f5f7fa;
			border-radius: 12px;
			padding: 3px 10px;
			margin-top: 6px;
			.elem_icon { width: 15px; height: 15px; object-fit: contain; }
		}
	}
	.panel_sec {
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid #f0f2f5;
		&:first-child { border-top: none; margin-top: 0; padding-top: 0; }
		.sec_label {
			font-size: 12px;
			font-weight: 600;
			color: #909399;
			margin-bottom: 7px;
		}
	}
	.meta_row {
		display: flex;
		justify-content: space-between;
		font-size: 13px;
		padding: 2px 0;
		span { color: #909399; }
		b { color: #303133; font-weight: 600; }
	}
	.bonus_line {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		font-size: 12px;
		color: #606266;
		line-height: 1.5;
		margin-top: 6px;
		background: #f8f9fb;
		border-radius: 6px;
		padding: 6px 8px;
		&.leader { background: #fdf6ec; }
		b { color: #303133; margin-right: 2px; white-space: nowrap; }
		.leader_icon { width: 22px; height: 22px; object-fit: contain; flex-shrink: 0; }
	}

	/* 左栏基础属性:三列紧凑,min~max 可见 */
	.stat_mini_grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
		.stat_mini {
			background: #f8f9fb;
			border-radius: 6px;
			padding: 5px 4px 6px;
			display: flex;
			flex-direction: column;
			align-items: center;
			cursor: default;
			.sm_label { font-size: 11px; color: #909399; line-height: 1.3; text-align: center; }
			.sm_value { font-size: 12.5px; font-weight: 700; color: #303133; line-height: 1.4; white-space: nowrap; }
		}
	}

	/* 觉醒形态:带进阶箭头 */
	.forms_row {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		align-items: center;
		.form_item {
			position: relative;
			width: 60px;
			height: 60px;
			border-radius: 8px;
			border: 2px solid #ebeef5;
			background: #f8f9fb;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			img { width: 46px; height: 46px; object-fit: contain; }
			.stage_n {
				position: absolute;
				right: 3px;
				bottom: 1px;
				font-size: 10px;
				color: #c0c4cc;
				font-weight: 700;
			}
			&:hover { border-color: #409eff; }
			&.current { border-color: #409eff; background: #ecf5ff; }
			&.off { cursor: default; opacity: 0.75; }
		}
		.form_arrow {
			color: #c0c4cc;
			font-size: 14px;
			flex-shrink: 0;
		}
	}
	/* 同族切换:方形瓦片 + 官方元素图标角标 */
	.sib_row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		.sib_item {
			position: relative;
			width: 52px;
			height: 52px;
			border-radius: 8px;
			border: 2px solid #ebeef5;
			background: #f8f9fb;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			img { width: 40px; height: 40px; object-fit: contain; }
			.sib_elem {
				position: absolute;
				right: -4px;
				bottom: -4px;
				width: 17px;
				height: 17px;
				object-fit: contain;
				background: #ffffff;
				border-radius: 4px;
				padding: 1px;
				box-shadow: 0 0 0 1px #ebeef5;
			}
			&:hover { border-color: #409eff; }
			&.current { border-color: #409eff; background: #ecf5ff; }
		}
	}
	/* ===== 右栏(紧凑) ===== */
	.section_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 12px 16px 14px;
		margin-bottom: 12px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.section_title {
			font-size: 14px;
			font-weight: 600;
			color: #303133;
			padding-left: 8px;
			border-left: 3px solid #409eff;
			margin-bottom: 10px;
			display: flex;
			align-items: center;
			gap: 8px;
			.section_count {
				font-size: 12px;
				color: #909399;
				font-weight: 400;
			}
		}
	}
	.skill_head {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-bottom: 8px;
		.skill_icon {
			width: 40px;
			height: 40px;
			object-fit: contain;
			background: #f8f9fb;
			border-radius: 8px;
			padding: 3px;
		}
		.skill_head_texts { flex: 1; min-width: 0; }
		.skill_name_row {
			display: flex;
			align-items: baseline;
			gap: 8px;
			flex-wrap: wrap;
			.skill_slot { font-size: 12px; color: #909399; }
			.skill_name { font-size: 14px; font-weight: 600; color: #303133; }
			.skill_lv { font-size: 12px; color: #409eff; }
		}
		.skill_sub {
			font-size: 12px;
			color: #909399;
			margin-top: 2px;
			code { background: #f0f2f5; border-radius: 4px; padding: 1px 6px; color: #476582; }
		}
	}
	.skill_desc {
		font-size: 13px;
		color: #606266;
		line-height: 1.6;
		margin: 0 0 8px;
		white-space: pre-line;
	}

	/* 效果:有图标仅显图(悬停说明),无图标文本 pill */
	.effect_row {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		align-items: center;
		margin-bottom: 8px;
		.eff_chip {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			border-radius: 6px;
			font-size: 12px;
			cursor: help;
			background: #f0f2f5;
			color: #606266;
			img {
				width: 24px;
				height: 24px;
				object-fit: contain;
				display: block;
				padding: 1px;
			}
			.eff_name { padding: 2px 8px; }
			&.buff { background: #f0f9eb; border: 1px solid #e1f3d8; }
			&.debuff { background: #fef0f0; border: 1px solid #fde2e2; }
		}
	}

	.skillup_box {
		background: #f8f9fb;
		border-radius: 8px;
		padding: 8px 12px;
		.skillup_title { font-size: 12px; font-weight: 600; color: #909399; margin-bottom: 4px; }
		.skillup_item {
			display: flex;
			gap: 8px;
			font-size: 13px;
			color: #606266;
			padding: 1px 0;
			.su_n { color: #67c23a; font-weight: 600; min-width: 28px; }
		}
	}

	/* 平衡补丁 */
	.bal_item {
		display: flex;
		align-items: baseline;
		gap: 10px;
		flex-wrap: wrap;
		padding: 8px 0;
		border-bottom: 1px dashed #ebeef5;
		font-size: 13px;
		&:last-of-type { border-bottom: none; }
		.bal_date { color: #909399; font-size: 12px; white-space: nowrap; }
		.bal_badge {
			border-radius: 4px;
			padding: 1px 6px;
			font-size: 11px;
			background: #f0f2f5;
			color: #909399;
			white-space: nowrap;
			&.up { background: #f0f9eb; color: #529b2e; }
			&.down { background: #fef0f0; color: #c45656; }
		}
		.bal_skill { color: #303133; font-weight: 600; }
		.bal_text { color: #606266; flex: 1; min-width: 240px; }
	}
	.bal_more {
		text-align: center;
		color: #409eff;
		font-size: 13px;
		cursor: pointer;
		padding-top: 8px;
	}

	/* 底部 3v3 预留区(左|右 之下,跨全宽) */
	.pvp3_section { margin-top: 2px; }
	.pvp3_block {
		margin-bottom: 12px;
		&:last-child { margin-bottom: 0; }
		.pvp3_sub {
			font-size: 13px;
			font-weight: 600;
			color: #606266;
			margin-bottom: 8px;
		}
		.pvp3_teams {
			display: flex;
			gap: 8px;
			flex-wrap: wrap;
		}
		.pvp3_team {
			display: flex;
			gap: 3px;
			padding: 4px 6px;
			background: #f5f7fa;
			border-radius: 6px;
			cursor: pointer;
			&:hover { background: #ecf5ff; }
			img {
				width: 28px;
				height: 28px;
				object-fit: contain;
				&.me { outline: 2px solid #e6a23c; border-radius: 4px; }
			}
		}
		.pvp3_more {
			align-self: center;
			font-size: 12px;
			color: #409eff;
			cursor: pointer;
			padding: 2px 8px;
		}
		.pvp3_empty {
			color: #c0c4cc;
			font-size: 12px;
			text-align: center;
			padding: 8px 0;
		}
	}
	.pvp3_placeholder {
		display: flex;
		align-items: center;
		gap: 24px;
		flex-wrap: wrap;
		border: 1px dashed #dcdfe6;
		border-radius: 8px;
		padding: 14px 16px;
		background: #fafbfc;
		.ph_team {
			display: flex;
			gap: 8px;
			.ph_slot {
				width: 44px;
				height: 44px;
				border-radius: 8px;
				border: 1px dashed #dcdfe6;
				background: #f2f4f7;
			}
		}
		.ph_text {
			flex: 1;
			min-width: 220px;
			margin: 0;
			font-size: 13px;
			color: #909399;
		}
	}

	@media (max-width: 900px) {
		padding: 12px 12px 24px;
		.detail_cols { grid-template-columns: 1fr; }
		.left_col { position: static; }
	}
}
</style>
