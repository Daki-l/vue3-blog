<template>
	<div class="monster_detail" v-loading="onLoading">
		<div class="detail_header">
			<el-button link @click="goBack">
				<span class="back_arrow">←</span> 返回
			</el-button>
			<span class="detail_title">{{ T(m.zh?.name, m.name) || '魔灵详情' }}</span>
		</div>

		<template v-if="m && m.com2us_id">
			<div class="detail_cols">
				<!-- 左栏:形象/形态/元素切换/基础信息 -->
				<div class="left_col">
					<div class="portrait_card" :style="{ borderTopColor: elementMeta(m.element).color }">
						<img class="elem_mark" :src="elementIconUrl(m.element)" :alt="m.element" />
						<img class="big_img" :src="monsterImg(m.image, true)" :alt="m.name" />
						<div class="stars_row">{{ '★'.repeat(m.natural_stars) }}</div>
						<div class="elem_line">
							<img class="elem_icon" :src="elementIconUrl(m.element)" />
							<span>{{ elementMeta(m.element).label }}属性 · {{ archetypeLabel(m.archetype) }}</span>
						</div>
					</div>

					<!-- 觉醒形态图廊 -->
					<div class="side_card" v-if="forms.length">
						<div class="side_title">觉醒形态</div>
						<div class="forms_row">
							<div
								v-for="(f, i) in forms"
								:key="f.id"
								class="form_item"
								:class="{ current: f.id === m.com2us_id, off: !f.linked }"
								:title="f.linked ? `${f.name || ''} (#${f.id})` : `#${f.id} 未收录`"
								@click="f.linked && f.id !== m.com2us_id && goDetail(f.id)">
								<img :src="monsterImg(f.image)" loading="lazy" />
								<span class="stage_n">{{ i + 1 }}</span>
							</div>
						</div>
					</div>

					<!-- 同族元素快切(方形瓦片 + 官方元素图标角标) -->
					<div class="side_card" v-if="siblings.length">
						<div class="side_title">同族切换</div>
						<div class="sib_row">
							<div
								v-for="s in siblings"
								:key="s.id"
								class="sib_item"
								:class="{ current: s.id === m.com2us_id }"
								:title="`${s.name}(${elementMeta(s.element).label})`"
								@click="s.id !== m.com2us_id && goDetail(s.id)">
								<img :src="monsterImg(s.image)" loading="lazy" />
								<img class="sib_elem" :src="elementIconUrl(s.element)" :alt="s.element" />
							</div>
						</div>
					</div>

					<!-- 基础属性(左栏紧凑三列) -->
					<div class="side_card">
						<div class="side_title">基础属性</div>
						<div class="stat_mini_grid">
							<div class="stat_mini" v-for="key in statKeys" :key="key" :title="`${STAT_LABELS[key]}: ${m.stats?.[key]?.min ?? '-'} ~ ${m.stats?.[key]?.max ?? '-'}${m.stats?.[key]?.isPercent ? '%' : ''}`">
								<span class="sm_label">{{ STAT_LABELS[key] || key }}</span>
								<span class="sm_value">{{ fmtStat(m.stats?.[key]) }}</span>
							</div>
						</div>
					</div>

					<div class="side_card">
						<div class="side_title">基础信息</div>
						<div class="meta_row"><span>定位</span><b>{{ archetypeLabel(m.archetype) }}</b></div>
						<div class="meta_row"><span>家族</span><b>{{ m.family }}</b></div>
						<div class="meta_row" v-if="m.unawakened_name && m.unawakened_name !== m.name"><span>未觉醒</span><b>{{ m.unawakened_name }}</b></div>
						<div class="meta_row" v-if="m.collab"><span>联动</span><b>{{ m.collab }}</b></div>
						<div class="bonus_box leader" v-if="m.leader_skill && m.leader_skill.text">
							<div class="bonus_label">
								<img class="leader_icon" :src="leaderIconUrl(m.leader_skill.icon)" v-if="m.leader_skill.icon" />
								队长技能
							</div>
							<p>{{ T(m.zh?.leader_skill, m.leader_skill.text) }}</p>
						</div>
						<div class="bonus_box" v-if="m.awaken_bonus">
							<div class="bonus_label">觉醒加成</div>
							<p>{{ T(m.zh?.awaken_bonus, m.awaken_bonus) }}</p>
						</div>
					</div>
				</div>

				<!-- 右栏:技能 + 平衡补丁(属性已移左栏) -->
				<div class="right_col">
					<div class="section_card" v-for="(s, i) in m.skills || []" :key="s.slot">
						<div class="skill_head">
							<img class="skill_icon" :src="skillIconUrl(s.icon)" v-if="s.icon" />
							<div class="skill_head_texts">
								<div class="skill_name_row">
									<span class="skill_slot">技能 {{ s.slot }}</span>
									<span class="skill_name">{{ T(m.zh?.skills?.[i]?.name, s.name) }}</span>
									<span class="skill_lv" v-if="s.level_text">{{ s.level_text }}</span>
								</div>
								<div class="skill_sub" v-if="s.multiplier">
									倍率系数:<code>{{ s.multiplier }}</code>
									<template v-if="s.scales_with && s.scales_with.length"> · 依赖 {{ s.scales_with.join(' / ') }}</template>
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
							<div class="skillup_title">强化效果</div>
							<div class="skillup_item" v-for="su in s.skillups" :key="su.n">
								<span class="su_n">+{{ su.n }}</span>
								<span>{{ T(m.zh?.skills?.[i]?.skillups?.[su.n - 1]?.text, su.text) }}</span>
							</div>
						</div>
					</div>

					<!-- 平衡补丁时间线 -->
					<div class="section_card" v-if="balanceList.length">
						<div class="section_title">平衡补丁记录<span class="section_count">{{ balanceList.length }}</span></div>
						<div class="bal_item" v-for="(b, i) in shownBalance" :key="i">
							<span class="bal_date">{{ b.date }}</span>
							<span class="bal_badge" :class="balClass(b.changeType)">{{ b.changeType }}</span>
							<span class="bal_skill" v-if="b.skillName">{{ b.slot }} {{ b.skillName }}</span>
							<span class="bal_text">{{ b.text }}</span>
						</div>
						<div class="bal_more" v-if="balanceList.length > 5" @click="showAllBalance = !showAllBalance">
							{{ showAllBalance ? '收起' : `展开全部 ${balanceList.length} 条` }}
						</div>
					</div>
				</div>
			</div>

			<!-- 底部 3v3 展示区(占位,阶段二接入:登录后查看该魔灵相关防守/克制) -->
			<div class="section_card pvp3_section">
				<div class="section_title">
					3v3 攻防
					<span class="section_count">该魔灵相关的防守队伍与克制方案(建设中)</span>
				</div>
				<div class="pvp3_placeholder">
					<div class="ph_team" v-for="n in 3" :key="n">
						<span class="ph_slot" v-for="k in 3" :key="k"></span>
					</div>
					<p class="ph_text">3v3 数据准备中,完成后此处展示该魔灵出场的防守队伍与推荐克制(需登录)</p>
				</div>
			</div>
		</template>
		<el-empty v-else-if="!onLoading" description="未找到该魔灵" :image-size="90" />
	</div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
	fetchMonster, fetchMonsterList, monsterImg, skillIconUrl, leaderIconUrl, effectIconUrl,
	elementIconUrl, elementMeta, archetypeLabel, pick, STAT_LABELS
} from '@/services/monster';

const route = useRoute();
const router = useRouter();

const m = ref({});
const minList = ref([]);
const onLoading = ref(false);
const showAllBalance = ref(false);
const T = pick;

const statKeys = ['hp', 'atk', 'def', 'spd', 'cr', 'cd', 'res', 'acc', 'skillups'];

const fmtStat = (s) => (s ? s.value + (s.isPercent ? '%' : '') : '-');

/** 觉醒形态:来自增强数据 forms,叠加 min 列表名称/可跳转标记 */
const forms = computed(() => {
	const list = m.value.forms || [];
	const idx = {};
	for (const it of minList.value) idx[it.id] = it;
	return list.map((f) => ({ ...f, linked: !!idx[f.id], name: idx[f.id]?.name || '' }));
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

const goBack = () => {
	if (window.history.state && window.history.state.back) router.back();
	else router.push('/monster');
};
const goDetail = (id) => router.push(`/monster/${id}`);

const load = async (id) => {
	onLoading.value = true;
	m.value = {};
	try {
		const [detail, list] = await Promise.all([fetchMonster(id), fetchMonsterList().catch(() => [])]);
		m.value = detail || {};
		minList.value = list;
	} catch (e) {
		console.error('获取魔灵详情失败', e);
	} finally {
		onLoading.value = false;
	}
};

onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => id && load(id));
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

	/* ===== 左栏 ===== */
	.left_col {
		display: flex;
		flex-direction: column;
		gap: 10px;
		position: sticky;
		top: 12px;
	}
	.portrait_card {
		position: relative;
		background: #ffffff;
		border-radius: 10px;
		border-top: 4px solid #909399;
		padding: 12px 12px 10px;
		text-align: center;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.big_img { width: 132px; height: 132px; object-fit: contain; }
		.stars_row { color: #d9a521; letter-spacing: 3px; margin-top: 2px; font-size: 13px; }
		.elem_mark {
			position: absolute;
			top: 8px;
			right: 8px;
			width: 24px;
			height: 24px;
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
			margin-top: 8px;
			.elem_icon { width: 16px; height: 16px; object-fit: contain; }
		}
	}
	.side_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 10px 12px 12px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.side_title {
			font-size: 12px;
			font-weight: 600;
			color: #909399;
			margin-bottom: 8px;
		}
		.meta_row {
			display: flex;
			justify-content: space-between;
			font-size: 13px;
			padding: 3px 0;
			span { color: #909399; }
			b { color: #303133; font-weight: 600; }
		}
	}
	/* 觉醒形态 */
	.forms_row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		.form_item {
			position: relative;
			width: 66px;
			height: 66px;
			border-radius: 8px;
			border: 2px solid #ebeef5;
			background: #f8f9fb;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			img { width: 52px; height: 52px; object-fit: contain; }
			.stage_n {
				position: absolute;
				right: 3px;
				bottom: 2px;
				font-size: 10px;
				color: #c0c4cc;
				font-weight: 700;
			}
			&:hover { border-color: #409eff; }
			&.current { border-color: #409eff; background: #ecf5ff; }
			&.off { cursor: default; opacity: 0.75; }
		}
	}
	/* 同族切换:方形瓦片 + 官方元素图标角标 */
	.sib_row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		.sib_item {
			position: relative;
			width: 54px;
			height: 54px;
			border-radius: 8px;
			border: 2px solid #ebeef5;
			background: #f8f9fb;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			img { width: 42px; height: 42px; object-fit: contain; }
			.sib_elem {
				position: absolute;
				right: -4px;
				bottom: -4px;
				width: 18px;
				height: 18px;
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
	.bonus_box {
		margin-top: 10px;
		padding: 10px 12px;
		background: #f8f9fb;
		border-radius: 8px;
		font-size: 13px;
		color: #606266;
		&.leader { background: #fdf6ec; }
		.bonus_label {
			display: flex;
			align-items: center;
			gap: 6px;
			font-weight: 600;
			color: #303133;
			margin-bottom: 4px;
			.leader_icon { width: 26px; height: 26px; object-fit: contain; }
		}
		p { margin: 0; line-height: 1.6; }
	}

	/* 左栏基础属性:三列紧凑(min~max 悬停查看) */
	.stat_mini_grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 4px;
		.stat_mini {
			background: #f8f9fb;
			border-radius: 6px;
			padding: 5px 6px;
			display: flex;
			flex-direction: column;
			align-items: center;
			cursor: default;
			.sm_label { font-size: 11px; color: #909399; line-height: 1.2; }
			.sm_value { font-size: 13px; font-weight: 700; color: #303133; line-height: 1.4; }
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
