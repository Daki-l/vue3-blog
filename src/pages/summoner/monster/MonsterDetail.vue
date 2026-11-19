<template>
	<div class="monster_detail" v-loading="onLoading">
		<div class="detail_header">
			<el-button link @click="goBack">
				<span class="back_arrow">←</span> 返回
			</el-button>
			<span class="detail_title">{{ T(m.zh?.name, m.name) || '魔灵详情' }}</span>
		</div>

		<template v-if="m && m.com2us_id">
			<!-- 基础信息卡 -->
			<div class="info_card" :style="{ borderLeftColor: elementMeta(m.element).color }">
				<div class="info_main">
					<img class="big_img" :src="monsterImg(m.image, true)" :alt="m.name" />
					<div class="info_texts">
						<div class="name_row">
							<span class="m_name">{{ T(m.zh?.name, m.name) }}</span>
							<span class="stars">{{ '★'.repeat(m.natural_stars) }}</span>
						</div>
						<div class="tag_row">
							<el-tag :color="elementMeta(m.element).color" effect="dark" size="small" class="elem_tag">
								{{ elementMeta(m.element).label }}属性
							</el-tag>
							<el-tag size="small" type="info">{{ archetypeLabel(m.archetype) }}</el-tag>
							<el-tag v-if="m.collab" size="small" type="warning">联动</el-tag>
						</div>
						<div class="family_line">家族:{{ m.family }}<template v-if="m.unawakened_name && m.unawakened_name !== m.name"> / 未觉醒:{{ m.unawakened_name }}</template></div>
						<div class="chain_line">
							<span class="chain_label">觉醒链:</span>
							<template v-for="cid in m.awakening_chain || []" :key="cid">
								<button
									class="chain_chip"
									:class="{ current: cid === m.com2us_id, missing: !chainNames[cid] }"
									:disabled="!chainNames[cid] || cid === m.com2us_id"
									@click="goDetail(cid)">
									{{ chainNames[cid] || `#${cid} 未收录` }}
								</button>
							</template>
						</div>
					</div>
				</div>
				<div class="bonus_box" v-if="m.awaken_bonus">
					<span class="bonus_label">觉醒加成</span>
					<span>{{ T(m.zh?.awaken_bonus, m.awaken_bonus) }}</span>
				</div>
				<div class="bonus_box leader" v-if="m.leader_skill && m.leader_skill.text">
					<span class="bonus_label">队长技能</span>
					<img class="leader_icon" :src="leaderIconUrl(m.leader_skill.icon)" v-if="m.leader_skill.icon" />
					<span>{{ T(m.zh?.leader_skill, m.leader_skill.text) }}</span>
				</div>
			</div>

			<!-- 属性卡 -->
			<div class="section_card">
				<div class="section_title">基础属性</div>
				<div class="stat_grid">
					<div class="stat_cell" v-for="key in statKeys" :key="key">
						<span class="stat_label">{{ STAT_LABELS[key] || key }}</span>
						<span class="stat_value">{{ fmtStat(m.stats?.[key]) }}</span>
						<span class="stat_range" v-if="m.stats?.[key]">{{ m.stats[key].min }} ~ {{ m.stats[key].max }}{{ m.stats[key].isPercent ? '%' : '' }}</span>
					</div>
				</div>
			</div>

			<!-- 技能卡 -->
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
				<div class="effect_row" v-if="s.effects && s.effects.length">
					<span class="effect_tag" v-for="(ef, j) in s.effects" :key="j" :title="ef">{{ shortEffect(ef) }}</span>
				</div>
				<div class="skillup_box" v-if="s.skillups && s.skillups.length">
					<div class="skillup_title">强化效果</div>
					<div class="skillup_item" v-for="su in s.skillups" :key="su.n">
						<span class="su_n">+{{ su.n }}</span>
						<span>{{ T(m.zh?.skills?.[i]?.skillups?.[su.n - 1]?.text, su.text) }}</span>
					</div>
				</div>
			</div>
		</template>
		<el-empty v-else-if="!onLoading" description="未找到该魔灵" :image-size="90" />
	</div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
	fetchMonster, fetchMonsterList, monsterImg, skillIconUrl, leaderIconUrl,
	elementMeta, archetypeLabel, pick, STAT_LABELS
} from '@/services/monster';

const route = useRoute();
const router = useRouter();

const m = ref({});
const onLoading = ref(false);
const chainNames = ref({});
const T = pick;

const statKeys = ['hp', 'atk', 'def', 'spd', 'cr', 'cd', 'res', 'acc', 'skillups'];

const fmtStat = (s) => {
	if (!s) return '-';
	return s.value + (s.isPercent ? '%' : '');
};

/** 效果标签过长时只取首个词,完整内容放 title */
const shortEffect = (ef) => {
	const first = String(ef).trim().split(/\s+/)[0];
	return first.length > 14 ? first.slice(0, 14) + '…' : first;
};

const goBack = () => {
	if (window.history.state && window.history.state.back) {
		router.back();
	} else {
		router.push('/monster');
	}
};

const goDetail = (id) => {
	router.push(`/monster/${id}`);
};

const load = async (id) => {
	onLoading.value = true;
	m.value = {};
	try {
		const [detail, list] = await Promise.all([fetchMonster(id), fetchMonsterList().catch(() => [])]);
		m.value = detail || {};
		const names = {};
		for (const it of list) names[it.id] = it.name;
		chainNames.value = names;
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
		.back_arrow {
			font-weight: 600;
		}
		.detail_title {
			font-size: 18px;
			font-weight: 600;
			color: #303133;
		}
	}

	.info_card {
		background: #ffffff;
		border-radius: 10px;
		border-left: 5px solid #909399;
		padding: 16px 20px;
		margin-bottom: 16px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.info_main {
			display: flex;
			gap: 18px;
			align-items: flex-start;
			flex-wrap: wrap;
		}
		.big_img {
			width: 108px;
			height: 108px;
			object-fit: contain;
			background: #f8f9fb;
			border-radius: 10px;
			padding: 6px;
		}
		.info_texts {
			flex: 1;
			min-width: 240px;
			.name_row {
				display: flex;
				align-items: baseline;
				gap: 10px;
				.m_name {
					font-size: 20px;
					font-weight: 700;
					color: #303133;
				}
				.stars {
					color: #d9a521;
					font-size: 13px;
					letter-spacing: 2px;
				}
			}
			.tag_row {
				display: flex;
				gap: 8px;
				margin: 8px 0;
				.elem_tag {
					border: none;
				}
			}
			.family_line {
				font-size: 13px;
				color: #606266;
				margin-bottom: 6px;
			}
			.chain_line {
				display: flex;
				align-items: center;
				gap: 6px;
				flex-wrap: wrap;
				.chain_label {
					font-size: 13px;
					color: #909399;
				}
				.chain_chip {
					border: 1px solid #dcdfe6;
					background: #ffffff;
					color: #409eff;
					border-radius: 12px;
					padding: 2px 10px;
					font-size: 12px;
					cursor: pointer;
					&.current {
						background: #409eff;
						border-color: #409eff;
						color: #ffffff;
						cursor: default;
					}
					&.missing {
						color: #c0c4cc;
						cursor: not-allowed;
						border-style: dashed;
					}
				}
			}
		}
		.bonus_box {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-top: 12px;
			padding: 10px 12px;
			background: #f8f9fb;
			border-radius: 8px;
			font-size: 13px;
			color: #606266;
			flex-wrap: wrap;
			&.leader {
				background: #fdf6ec;
			}
			.bonus_label {
				font-weight: 600;
				color: #303133;
				white-space: nowrap;
			}
			.leader_icon {
				width: 28px;
				height: 28px;
				object-fit: contain;
			}
		}
	}

	.section_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 16px 20px 18px;
		margin-bottom: 16px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.section_title {
			font-size: 15px;
			font-weight: 600;
			color: #303133;
			padding-left: 8px;
			border-left: 3px solid #409eff;
			margin-bottom: 14px;
		}
	}

	.stat_grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
		gap: 10px;
		.stat_cell {
			background: #f8f9fb;
			border-radius: 8px;
			padding: 10px 12px;
			display: flex;
			flex-direction: column;
			gap: 2px;
			.stat_label {
				font-size: 12px;
				color: #909399;
			}
			.stat_value {
				font-size: 17px;
				font-weight: 700;
				color: #303133;
			}
			.stat_range {
				font-size: 11px;
				color: #c0c4cc;
			}
		}
	}

	.skill_head {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-bottom: 10px;
		.skill_icon {
			width: 44px;
			height: 44px;
			object-fit: contain;
			background: #f8f9fb;
			border-radius: 8px;
			padding: 4px;
		}
		.skill_head_texts {
			flex: 1;
			min-width: 0;
		}
		.skill_name_row {
			display: flex;
			align-items: baseline;
			gap: 8px;
			flex-wrap: wrap;
			.skill_slot {
				font-size: 12px;
				color: #909399;
			}
			.skill_name {
				font-size: 15px;
				font-weight: 600;
				color: #303133;
			}
			.skill_lv {
				font-size: 12px;
				color: #409eff;
			}
		}
		.skill_sub {
			font-size: 12px;
			color: #909399;
			margin-top: 2px;
			code {
				background: #f0f2f5;
				border-radius: 4px;
				padding: 1px 6px;
				color: #476582;
			}
		}
	}

	.skill_desc {
		font-size: 13px;
		color: #606266;
		line-height: 1.7;
		margin: 0 0 10px;
		white-space: pre-line;
	}

	.effect_row {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 10px;
		.effect_tag {
			background: #ecf5ff;
			color: #409eff;
			border-radius: 4px;
			padding: 2px 8px;
			font-size: 12px;
		}
	}

	.skillup_box {
		background: #f8f9fb;
		border-radius: 8px;
		padding: 10px 14px;
		.skillup_title {
			font-size: 12px;
			font-weight: 600;
			color: #909399;
			margin-bottom: 6px;
		}
		.skillup_item {
			display: flex;
			gap: 8px;
			font-size: 13px;
			color: #606266;
			padding: 2px 0;
			.su_n {
				color: #67c23a;
				font-weight: 600;
				min-width: 28px;
			}
		}
	}

	@media (max-width: 768px) {
		padding: 12px 12px 24px;
		.stat_grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		}
	}
}
</style>
