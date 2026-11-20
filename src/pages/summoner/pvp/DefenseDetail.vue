<template>
	<div class="pvp_detail" v-loading="onLoading">
		<template v-if="defense">
			<div class="page_header">
				<span class="page_title">{{ t('pvp.defenseTitle') }}</span>
				<el-button link @click="router.back()">{{ t('common.back') }}</el-button>
			</div>

			<!-- 防守队 -->
			<div class="defense_card">
				<div class="d_monsters">
					<div v-for="m in defense.monsters" :key="m.id" class="d_mon" @click="goMonster(m.id)">
						<img :src="monsterImg(m.image)" />
						<span class="d_name">{{ zhName(m) }}</span>
					</div>
				</div>
				<div class="d_side">
					<div class="d_count">{{ t('pvp.counterCount', defense.counters.length) }}</div>
					<div class="d_asof" v-if="asOf">{{ t('pvp.asOf', asOf) }}</div>
				</div>
			</div>

			<!-- 排序条 -->
			<div class="sort_bar">
				<el-radio-group v-model="sortMode" size="small">
					<el-radio-button value="score">{{ t('pvp.sortScore') }}</el-radio-button>
					<el-radio-button value="hot">{{ t('pvp.sortHot') }}</el-radio-button>
					<el-radio-button value="new">{{ t('pvp.sortNew') }}</el-radio-button>
				</el-radio-group>
			</div>

			<!-- 克制列表 -->
			<div v-if="sortedCounters.length" class="counter_list">
				<div v-for="(c, i) in sortedCounters" :key="c.id" class="counter_card">
					<div class="c_head">
						<span class="c_rank">#{{ i + 1 }}</span>
						<div class="c_monsters">
							<div v-for="m in c.monsters" :key="m.id" class="c_mon" @click="goMonster(m.id)">
								<img :src="monsterImg(m.image)" />
								<span class="c_name">{{ zhName(m) }}</span>
							</div>
						</div>
						<div class="c_rating">
							<el-rate :model-value="c.rating_avg ?? 0" disabled size="small" v-if="c.rating_count" />
							<span class="c_score" v-if="c.score">{{ c.score.toFixed(1) }}</span>
							<span class="c_rc" v-if="c.rating_count">{{ t('pvp.ratedBy', c.rating_count) }}</span>
							<span class="c_rc" v-else>{{ t('pvp.unrated') }}</span>
						</div>
					</div>
					<div class="c_foot">
						<span class="c_by" v-if="c.contributor">{{ t('pvp.by', c.contributor) }} · {{ c.created_at }}</span>
						<div class="c_actions">
							<el-button size="small" :type="myReaction(c.id) === 1 ? 'success' : ''" @click="react(c.id, 1)">
								👍 {{ stats[c.id]?.likes ?? 0 }}
							</el-button>
							<el-button size="small" :type="myReaction(c.id) === -1 ? 'danger' : ''" @click="react(c.id, -1)">
								👎 {{ stats[c.id]?.dislikes ?? 0 }}
							</el-button>
							<el-button size="small" @click="toggleFav('counter', c.id)">
								{{ isFav('counter', c.id) ? '★' : '☆' }}
							</el-button>
						</div>
					</div>
					<el-collapse v-if="c.strategies.length" class="c_strategies">
						<el-collapse-item :title="t('pvp.strategyCount', c.strategies.length)" :name="c.id">
							<div v-for="s in c.strategies" :key="s.text.slice(0, 24)" class="strategy_item">
								<div class="s_text">{{ s.text }}</div>
								<div class="s_meta">
									<span v-if="s.author">{{ s.author }}</span>
									<span class="s_votes" v-if="s.votes_up || s.votes_down">👍{{ s.votes_up }} 👎{{ Math.abs(s.votes_down) }}</span>
								</div>
							</div>
						</el-collapse-item>
					</el-collapse>
				</div>
			</div>
			<el-empty v-else :description="t('pvp.noCounters')" :image-size="90" />

			<!-- 互动:赞踩/收藏(防守本体) + 评论区 -->
			<div class="target_actions">
				<el-button :type="myDefenseReaction === 1 ? 'success' : ''" @click="reactDefense(1)">👍 {{ statsDefense.likes }}</el-button>
				<el-button :type="myDefenseReaction === -1 ? 'danger' : ''" @click="reactDefense(-1)">👎 {{ statsDefense.dislikes }}</el-button>
				<el-button @click="toggleFav('defense', defenseId)">{{ isFav('defense', defenseId) ? '★' : '☆' }} {{ t('pvp.fav') }}</el-button>
			</div>

			<CommentSection :target-type="'defense'" :target-id="defenseId" />
		</template>
		<el-empty v-else-if="!onLoading" :description="t('pvp.notFound')" :image-size="90">
			<el-button type="primary" @click="router.push('/3v3')">{{ t('pvp.backSearch') }}</el-button>
		</el-empty>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { fetchMonsterList, fetchZhNames, monsterImg } from '@/services/monster';
import { fetchDefense, fetch3mdcManifest } from '@/services/3mdc';
import { getStats, react as apiReact, toggleFavorite as apiFavToggle } from '@/services/interact3mdc';
import { useUserStore } from '@/stores/user';
import CommentSection from '@/components/interact/CommentSection.vue';
import { t, isZh } from '@/common/i18n';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const defense = ref(null);
const manifest = ref(null);
const onLoading = ref(false);
const zhNames = ref(null);

const key = computed(() => String(route.params.key || ''));
const defenseId = computed(() => defense.value?.defense_id ?? 0);
const asOf = computed(() => manifest.value?.swgt_data_as_of?.slice(0, 10) || '');

const zhName = (m) => (isZh() && zhNames.value?.[m.id]?.n) || m.name;
const goMonster = (id) => router.push(`/monster/${id}`);

const sortMode = ref('score');
const sortedCounters = computed(() => {
  const list = [...(defense.value?.counters ?? [])];
  if (sortMode.value === 'hot') list.sort((a, b) => (b.rating_count ?? 0) - (a.rating_count ?? 0));
  else if (sortMode.value === 'new') list.sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
  else list.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  return list;
});

// ---- 互动:赞踩/收藏(登录制;未登录引导登录) ----
const stats = ref({});      // { [counterId]: {likes, dislikes} }
const statsDefense = ref({ likes: 0, dislikes: 0 });
const myReactions = ref({}); // { [counterId]: 1|-1 }
const myDefenseReaction = ref(0);
const favSet = ref(new Set());

const myReaction = (counterId) => myReactions.value[counterId] ?? 0;
const isFav = (type, id) => favSet.value.has(`${type}:${id}`);

const needLogin = () => {
  if (!userStore.isLogged) {
    ElMessage.warning(t('pvp.loginFirst'));
    router.push({ path: '/login', query: { redirect: route.fullPath } });
    return true;
  }
  return false;
};

async function loadInteract() {
  if (!userStore.isLogged || !defense.value) return;
  try {
    const ids = defense.value.counters.map((c) => c.id);
    if (ids.length) {
      const r = await getStats('counter', ids);
      stats.value = r.stats ?? {};
      myReactions.value = r.mine ?? {};
    }
    const rd = await getStats('defense', [defenseId.value]);
    statsDefense.value = rd.stats?.[defenseId.value] ?? { likes: 0, dislikes: 0 };
    myDefenseReaction.value = rd.mine?.[defenseId.value] ?? 0;
  } catch { /* 未部署互动接口时静默 */ }
}

async function react(counterId, value) {
  if (needLogin()) return;
  try {
    const r = await apiReact('counter', counterId, value);
    myReactions.value = { ...myReactions.value, [counterId]: r.value };
    stats.value = { ...stats.value, [counterId]: { likes: r.likes, dislikes: r.dislikes } };
  } catch (e) { ElMessage.error(e.message); }
}

async function reactDefense(value) {
  if (needLogin()) return;
  try {
    const r = await apiReact('defense', defenseId.value, value);
    myDefenseReaction.value = r.value;
    statsDefense.value = { likes: r.likes, dislikes: r.dislikes };
  } catch (e) { ElMessage.error(e.message); }
}

async function toggleFav(type, id) {
  if (needLogin()) return;
  try {
    const r = await apiFavToggle(type, id);
    const set = new Set(favSet.value);
    if (r.on) set.add(`${type}:${id}`); else set.delete(`${type}:${id}`);
    favSet.value = set;
    ElMessage.success(r.on ? t('pvp.favOn') : t('pvp.favOff'));
  } catch (e) { ElMessage.error(e.message); }
}

onMounted(async () => {
  onLoading.value = true;
  try {
    const [d, mf, zh] = await Promise.all([
      fetchDefense(key.value),
      fetch3mdcManifest().catch(() => null),
      fetchZhNames().catch(() => null)
    ]);
    zhNames.value = zh;
    manifest.value = mf;
    if (d) defense.value = d;
  } finally {
    onLoading.value = false;
  }
  loadInteract();
});
</script>

<style lang="less">
.pvp_detail {
	padding: 20px 24px 32px;
	background-color: #f5f7fa;
	min-height: 100%;

	.page_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
		.page_title {
			font-size: 20px;
			font-weight: 600;
			color: #303133;
			padding-left: 10px;
			border-left: 4px solid #409eff;
		}
	}

	.defense_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 14px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.d_monsters {
			display: flex;
			gap: 20px;
			flex-wrap: wrap;
		}
		.d_mon {
			text-align: center;
			cursor: pointer;
			img {
				width: 52px;
				height: 52px;
				object-fit: contain;
			}
			.d_name {
				display: block;
				font-size: 13px;
				font-weight: 600;
				color: #303133;
			}
		}
		.d_side {
			text-align: right;
			.d_count {
				font-size: 14px;
				color: #e6a23c;
				font-weight: 600;
			}
			.d_asof {
				font-size: 11px;
				color: #c0c4cc;
				margin-top: 4px;
			}
		}
	}

	.sort_bar {
		margin: 14px 0 10px;
	}

	.counter_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 12px 16px;
		margin-bottom: 10px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.c_head {
			display: flex;
			align-items: center;
			gap: 12px;
			flex-wrap: wrap;
		}
		.c_rank {
			color: #909399;
			font-size: 13px;
			min-width: 28px;
		}
		.c_monsters {
			display: flex;
			gap: 14px;
			flex-wrap: wrap;
		}
		.c_mon {
			text-align: center;
			cursor: pointer;
			img {
				width: 40px;
				height: 40px;
				object-fit: contain;
			}
			.c_name {
				display: block;
				font-size: 12px;
				color: #606266;
				max-width: 84px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
		.c_rating {
			margin-left: auto;
			display: flex;
			align-items: center;
			gap: 8px;
			flex-wrap: wrap;
			.c_score {
				color: #e6a23c;
				font-weight: 600;
				font-size: 15px;
			}
			.c_rc {
				font-size: 11px;
				color: #c0c4cc;
			}
		}
		.c_foot {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-top: 8px;
			flex-wrap: wrap;
			gap: 8px;
			.c_by {
				font-size: 11px;
				color: #c0c4cc;
			}
		}
		.c_strategies {
			margin-top: 8px;
			border-top: 1px dashed #ebeef5;
			.strategy_item {
				padding: 8px 4px;
				.s_text {
					font-size: 13px;
					color: #303133;
					line-height: 1.6;
					white-space: pre-wrap;
				}
				.s_meta {
					margin-top: 4px;
					font-size: 11px;
					color: #c0c4cc;
					display: flex;
					gap: 10px;
				}
			}
		}
	}

	.target_actions {
		margin: 16px 0;
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	@media (max-width: 768px) {
		padding: 12px 12px 24px;
	}
}
</style>
