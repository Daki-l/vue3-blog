<template>
	<div class="pvp_search" v-loading="onLoading">
		<div class="page_header">
			<span class="page_title">{{ t('pvp.title') }}</span>
			<span class="page_count" v-if="manifest">{{ t('pvp.stats', manifest.counts.defenses, manifest.counts.counters) }}</span>
		</div>

		<div class="main_cols">
			<!-- 左侧主体:选择 + 查询结果/内嵌详情 -->
			<div class="col_main">
				<div class="pick_card">
					<div class="pick_row">
						<div v-for="slot in 3" :key="slot" class="pick_slot">
							<MonsterPicker
								v-model="picked[slot - 1]"
								:monsters="monsterOptions"
								:placeholder="t('pvp.slotN', slot)"
								@change="onSearch" />
						</div>
						<el-button type="primary" :disabled="selCount < 2" @click="onSearch">{{ t('pvp.search') }}</el-button>
					</div>
					<div class="pick_hint">{{ t('pvp.pickHint') }}</div>
				</div>

				<!-- 内嵌详情:点击防守后原地展开,不再跳页 -->
				<template v-if="activeKey">
					<div class="inline_bar">
						<el-button link @click="activeKey = null">← {{ t('pvp.backList') }}</el-button>
					</div>
					<DefensePanel :dkey="activeKey" />
				</template>

				<template v-else>
					<!-- 精确命中:单结果直出 -->
					<template v-if="exact">
						<div class="section_title">{{ t('pvp.matchTitle') }}</div>
						<div class="defense_card hit" @click="openDefense(exact.k)">
							<div class="d_monsters">
								<div v-for="m in exact.monsters" :key="m.id" class="d_mon">
									<img :src="monsterImg(m.image)" />
									<span class="d_name">{{ pick(m.zh, m.name) }}</span>
								</div>
							</div>
							<div class="d_meta">
								<el-tag size="small" type="warning">{{ t('pvp.counterCount', exact.counter_count) }}</el-tag>
							</div>
						</div>
					</template>

					<!-- 部分命中:候选列表 -->
					<template v-else-if="candidates.length">
						<div class="section_title">{{ t('pvp.candidateTitle', candidates.length) }}</div>
						<div class="defense_card" v-for="c in candidates" :key="c.k" @click="openDefense(c.k)">
							<div class="d_monsters">
								<div v-for="m in c.monsters" :key="m.id" class="d_mon" :class="{ dim: !selSet.has(m.id) }">
									<img :src="monsterImg(m.image)" />
									<span class="d_name">{{ pick(m.zh, m.name) }}</span>
								</div>
							</div>
							<div class="d_meta">
								<el-tag size="small" type="warning">{{ t('pvp.counterCount', c.counter_count) }}</el-tag>
							</div>
						</div>
					</template>

					<!-- 无搜索态 -->
					<template v-else-if="searched">
						<el-empty :description="t('pvp.noMatch')" :image-size="90" />
					</template>
				</template>
			</div>

			<!-- 右侧:热门防守常驻榜 -->
			<div class="col_side" v-if="hotList.length">
				<div class="hot_card">
					<div class="hot_title">{{ t('pvp.hot') }}</div>
					<div class="hot_item" v-for="(h, i) in hotList" :key="h.k" :class="{ cur: h.k === activeKey }" @click="openDefense(h.k)">
						<span class="hot_rank" :class="'r' + Math.min(i + 1, 3)">{{ i + 1 }}</span>
						<div class="hot_avatars">
							<template v-for="m in hotAvatars(h.k)" :key="m.id">
								<img v-if="m.image" :src="monsterImg(m.image)" :title="m.name" loading="lazy" />
								<span v-else class="hot_fallback" :title="m.name">{{ m.name || '#' + m.id }}</span>
							</template>
						</div>
						<el-tag size="small" type="warning" effect="plain">{{ t('pvp.counterCount', h.c) }}</el-tag>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { fetchMonsterList, fetchZhNames, monsterImg, pick } from '@/services/monster';
import { fetch3mdcManifest, fetchDefense, fetchMonster3mdc, defenseKeyOf } from '@/services/3mdc';
import MonsterPicker from '@/components/pvp/MonsterPicker.vue';
import DefensePanel from '@/components/pvp/DefensePanel.vue';
import { t, isZh } from '@/common/i18n';

const picked = ref([null, null, null]);
const manifest = ref(null);
const exact = ref(null);
const candidates = ref([]);
const searched = ref(false);
const onLoading = ref(false);
const monsters = ref([]); // {id,name,image,element,archetype,stars,zh?}
const activeKey = ref(null); // 当前内嵌展示的防守 key(null=列表态)

const monsterOptions = computed(() => monsters.value);
const selCount = computed(() => picked.value.filter(Boolean).length);
const selSet = computed(() => new Set(picked.value.filter(Boolean)));

const zhOf = (id) => monsters.value.find((m) => m.id === id)?.name; // zh 覆盖后即中文名

/** 原地展开防守详情并回到页面顶部 */
const openDefense = (key) => {
	activeKey.value = key;
	nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
};

async function onSearch() {
	const ids = picked.value.filter(Boolean);
	activeKey.value = null;
	if (ids.length < 2) return;
	onLoading.value = true;
	exact.value = null;
	candidates.value = [];
	searched.value = true;
	try {
		if (ids.length === 3) {
			const d = await fetchDefense(defenseKeyOf(ids));
			if (d) {
				exact.value = { ...d, k: defenseKeyOf(ids), monsters: d.monsters.map((m) => ({ ...m, zh: zhOf(m.id) })) };
				return;
			}
		}
		// 2 只(或 3 只未命中):索引求交
		const idx = await Promise.all(ids.map((id) => fetchMonster3mdc(id)));
		if (idx.some((x) => !x)) return;
		let keys = new Set(idx[0].defenses);
		for (const ix of idx.slice(1)) keys = new Set([...keys].filter((k) => ix.defenses.includes(k)));
		const list = await Promise.all([...keys].slice(0, 30).map(async (k) => {
			const d = await fetchDefense(k);
			return d ? { ...d, k, monsters: d.monsters.map((m) => ({ ...m, zh: zhOf(m.id) })) } : null;
		}));
		candidates.value = list.filter(Boolean)
			.sort((a, b) => (b.counter_count ?? 0) - (a.counter_count ?? 0));
	} finally {
		onLoading.value = false;
	}
}

const hotList = computed(() => (manifest.value?.top ?? []).slice(0, 12));

/** 防守 key(排序三ID) -> 魔灵头像数组(经本地列表解析,含 zh 覆盖后的名字;缺图时 name 作文字回退) */
const hotAvatars = (key) =>
	String(key || '').split('-').filter(Boolean).map((id) => {
		const m = monsters.value.find((x) => x.id === Number(id));
		return m ? { id: m.id, image: m.image, name: m.name } : { id: Number(id), image: '', name: '' };
	});

onMounted(async () => {
	onLoading.value = true;
	try {
		const [list, zh, mf] = await Promise.all([
			fetchMonsterList(),
			fetchZhNames().catch(() => null),
			fetch3mdcManifest().catch(() => null)
		]);
		if (zh && isZh()) {
			for (const m of list) {
				const z = zh[m.id];
				if (z?.n) {
					m.name_en = m.name; // 保留英文原名(数据联接/反查用)
					m.name = z.n;
				}
			}
		}
		monsters.value = list;
		manifest.value = mf;
	} finally {
		onLoading.value = false;
	}
});
</script>

<style lang="less">
.pvp_search {
	padding: 20px 24px 32px;
	background-color: #f5f7fa;
	min-height: 100%;

	.page_header {
		display: flex;
		align-items: baseline;
		gap: 12px;
		margin-bottom: 16px;
		.page_title {
			font-size: 20px;
			font-weight: 600;
			color: #303133;
			padding-left: 10px;
			border-left: 4px solid #409eff;
		}
		.page_count {
			font-size: 12px;
			color: #909399;
		}
	}

	.main_cols {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 300px;
		gap: 16px;
		align-items: start;
	}

	.col_side {
		position: sticky;
		top: 70px;
	}

	.pick_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 16px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		margin-bottom: 16px;
		.pick_row {
			display: flex;
			gap: 10px;
			flex-wrap: wrap;
			align-items: center;
		}
		.pick_slot {
			position: relative;
			flex: 1;
			min-width: 180px;
		}
		.pick_hint {
			margin-top: 8px;
			font-size: 12px;
			color: #909399;
		}
	}

	.inline_bar {
		margin-bottom: 8px;
	}

	.section_title {
		font-size: 15px;
		font-weight: 600;
		color: #303133;
		margin: 14px 2px 10px;
	}

	.defense_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 12px 16px;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		transition: transform 0.15s, box-shadow 0.15s;
		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(31, 45, 61, 0.12);
		}
		&.hit {
			border: 1px solid #67c23a;
		}
		.d_monsters {
			display: flex;
			gap: 18px;
			flex-wrap: wrap;
		}
		.d_mon {
			text-align: center;
			&.dim img {
				opacity: 0.45;
			}
			img {
				width: 44px;
				height: 44px;
				object-fit: contain;
			}
			.d_name {
				display: block;
				font-size: 12px;
				color: #606266;
				max-width: 90px;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}

	.hot_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 12px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.hot_title {
			font-size: 14px;
			font-weight: 600;
			color: #303133;
			padding: 2px 2px 10px;
		}
		.hot_item {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 7px 6px;
			border-radius: 8px;
			cursor: pointer;
			&:hover {
				background: #f5f7fa;
			}
			&.cur {
				background: #ecf5ff;
			}
			.hot_rank {
				width: 20px;
				height: 20px;
				border-radius: 4px;
				background: #c0c4cc;
				color: #fff;
				font-size: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				flex: none;
				&.r1 { background: #e6a23c; }
				&.r2 { background: #909399; }
				&.r3 { background: #b87400; }
			}
			.hot_avatars {
				display: flex;
				gap: 2px;
				flex: 1;
				align-items: center;
				min-width: 0;
				img {
					width: 26px;
					height: 26px;
					object-fit: contain;
				}
				.hot_fallback {
					font-size: 11px;
					color: #909399;
					max-width: 60px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
			}
		}
	}

	@media (max-width: 992px) {
		.main_cols {
			grid-template-columns: 1fr;
		}
		.col_side {
			position: static;
		}
	}

	@media (max-width: 768px) {
		padding: 12px 12px 24px;
		.pick_slot {
			min-width: 130px;
		}
	}
}
</style>
