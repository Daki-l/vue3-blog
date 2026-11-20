<template>
	<div class="pvp_search" v-loading="onLoading">
		<div class="page_header">
			<span class="page_title">{{ t('pvp.title') }}</span>
			<span class="page_count" v-if="manifest">{{ t('pvp.stats', manifest.counts.defenses, manifest.counts.counters) }}</span>
		</div>

		<div class="pick_card">
			<div class="pick_row">
				<div v-for="slot in 3" :key="slot" class="pick_slot">
					<el-select
						v-model="picked[slot - 1]"
						class="pick_select"
						filterable
						clearable
						:placeholder="t('pvp.slotN', slot)"
						:value-key="'id'"
						@change="onSearch">
						<el-option v-for="m in monsterOptions" :key="m.id" :label="m.name" :value="m.id">
							<span class="opt_row">
								<img class="opt_icon" :src="monsterImg(m.image)" :alt="m.name" />
								<span>{{ m.name }}</span>
								<img class="opt_elem" :src="elementIconUrl(m.element)" />
							</span>
						</el-option>
					</el-select>
					<img v-if="picked[slot - 1]" class="picked_icon" :src="pickedIcon(slot - 1)" />
				</div>
				<el-button type="primary" :disabled="selCount < 2" @click="onSearch">{{ t('pvp.search') }}</el-button>
			</div>
			<div class="pick_hint">{{ t('pvp.pickHint') }}</div>
		</div>

		<!-- 精确命中:单结果直出 -->
		<template v-if="exact">
			<div class="section_title">{{ t('pvp.matchTitle') }}</div>
			<div class="defense_card hit" @click="goDefense(exact.k)">
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
			<div class="defense_card" v-for="c in candidates" :key="c.k" @click="goDefense(c.k)">
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

		<!-- 无搜索态:热门防守 -->
		<template v-else-if="searched && !candidates.length && !exact">
			<el-empty :description="t('pvp.noMatch')" :image-size="90" />
		</template>

		<template v-if="!searched && hotList.length">
			<div class="section_title">{{ t('pvp.hot') }}</div>
			<div class="hot_grid">
				<div v-for="(h, i) in hotList" :key="h.k" class="hot_item" @click="goDefense(h.k)">
					<span class="hot_rank" :class="'r' + Math.min(i + 1, 3)">{{ i + 1 }}</span>
					<span class="hot_names">{{ pick(h.zh, h.n) }}</span>
					<el-tag size="small" type="warning" effect="plain">{{ t('pvp.counterCount', h.c) }}</el-tag>
				</div>
			</div>
		</template>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchMonsterList, fetchZhNames, monsterImg, elementIconUrl } from '@/services/monster';
import { fetch3mdcManifest, fetchDefense, fetchMonster3mdc, defenseKeyOf } from '@/services/3mdc';
import { t, isZh } from '@/common/i18n';

const router = useRouter();
const picked = ref([null, null, null]);
const manifest = ref(null);
const exact = ref(null);
const candidates = ref([]);
const searched = ref(false);
const onLoading = ref(false);
const monsters = ref([]); // {id,name,image,element,zh?}

const monsterOptions = computed(() => monsters.value);
const selCount = computed(() => picked.value.filter(Boolean).length);
const selSet = computed(() => new Set(picked.value.filter(Boolean)));

const zhOf = (id) => monsters.value.find((m) => m.id === id)?.name; // zh 覆盖后即中文名
const pickedIcon = (i) => {
  const m = monsters.value.find((x) => x.id === picked.value[i]);
  return m ? monsterImg(m.image) : '';
};

const goDefense = (key) => router.push(`/3v3/${key}`);

async function onSearch() {
  const ids = picked.value.filter(Boolean);
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

const hotList = computed(() =>
  (manifest.value?.top ?? []).slice(0, 12).map((h) => ({ ...h, zh: hotZh(h.n) })));

const hotZh = (names) => {
  if (!isZh()) return names;
  return String(names || '').split(/\s+/).map((n) => {
    const m = monsters.value.find((x) => x.name === n);
    return m?.name ?? n; // monsters 已做 zh 覆盖,英文名反查
  }).join(' ');
};

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
        if (z?.n) m.name = z.n;
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
			.pick_select {
				width: 100%;
			}
			.picked_icon {
				position: absolute;
				right: 30px;
				top: 50%;
				transform: translateY(-50%);
				width: 22px;
				height: 22px;
				pointer-events: none;
			}
		}
		.pick_hint {
			margin-top: 8px;
			font-size: 12px;
			color: #909399;
		}
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

	.hot_grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 10px;
		.hot_item {
			background: #ffffff;
			border-radius: 8px;
			padding: 10px 12px;
			display: flex;
			align-items: center;
			gap: 10px;
			cursor: pointer;
			box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
			&:hover {
				box-shadow: 0 4px 12px rgba(31, 45, 61, 0.12);
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
			.hot_names {
				flex: 1;
				font-size: 13px;
				color: #303133;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}

	.opt_row {
		display: flex;
		align-items: center;
		gap: 6px;
		.opt_icon {
			width: 20px;
			height: 20px;
			object-fit: contain;
		}
		.opt_elem {
			width: 14px;
			height: 14px;
			margin-left: auto;
			object-fit: contain;
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
