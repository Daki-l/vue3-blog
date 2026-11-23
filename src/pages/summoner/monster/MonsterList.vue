<template>
	<div class="monster_list" v-loading="onLoading">
		<div class="page_header">
			<span class="page_title">{{ t('monster.title') }}</span>
			<span class="page_count" v-if="!onLoading">{{ t('monster.count', filtered.length) }}</span>
		</div>

		<div class="filter_card">
			<div class="filter_row">
				<div class="filter_group">
					<span class="filter_label">{{ t('monster.element') }}</span>
					<div class="elem_btns">
						<button
							v-for="e in elementOptions"
							:key="e.value"
							class="elem_btn"
							:class="{ active: element === e.value }"
							:style="element === e.value && e.color ? { backgroundColor: e.color, borderColor: e.color } : {}"
							@click="element = e.value">
							<img v-if="e.value" class="elem_btn_icon" :src="elementIconUrl(e.value)" />
							{{ e.label }}
						</button>
					</div>
				</div>
				<div class="filter_group">
					<span class="filter_label">{{ t('monster.archetype') }}</span>
					<el-select v-model="archetype" class="filter_select" clearable :placeholder="t('common.all')">
						<el-option v-for="a in archetypeOptions" :key="a.value" :label="a.label" :value="a.value" />
					</el-select>
				</div>
				<div class="filter_group">
					<span class="filter_label">{{ t('monster.stars') }}</span>
					<el-select v-model="stars" class="filter_select" clearable :placeholder="t('common.all')">
						<el-option v-for="s in 5" :key="s" :label="s + ' ' + t('monster.starsUnit')" :value="s" />
					</el-select>
				</div>
				<div class="filter_group grow">
					<el-input v-model="keyword" :placeholder="t('monster.searchPlaceholder')" clearable :prefix-icon="Search" />
				</div>
			</div>
		</div>

		<div class="card_grid" v-if="filtered.length">
			<div
				v-for="m in filtered"
				:key="m.id"
				class="monster_card"
				:style="{ borderLeftColor: elementMeta(m.element).color }"
				@click="goDetail(m.id)">
				<div class="card_img">
					<img :src="monsterImg(m.image)" :alt="m.name" loading="lazy" />
				</div>
				<div class="card_name" :title="m.name">{{ m.name }}</div>
				<div class="card_meta">
					<img class="elem_icon" :src="elementIconUrl(m.element)" :alt="m.element" />
					<span class="card_stars">{{ '★'.repeat(m.stars) }}</span>
				</div>
			</div>
		</div>
		<el-empty v-else-if="!onLoading" :description="t('monster.empty')" :image-size="90" />
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';
import { fetchMonsterList, fetchZhNames, monsterImg, elementMeta, elementIconUrl, ELEMENTS, ARCHETYPES } from '@/services/monster';
import { t, isZh } from '@/common/i18n';

const router = useRouter();

const all = ref([]);
const onLoading = ref(false);
const element = ref('');
const archetype = ref('');
const stars = ref(null);
const keyword = ref('');

const elementOptions = [{ value: '', label: t('common.all') }, ...ELEMENTS.map((e) => ({ ...e, label: t('elem.' + e.value) }))];
const archetypeOptions = ARCHETYPES.map((v) => ({ value: v, label: t('arch.' + v) }));

const filtered = computed(() => {
	const kw = keyword.value.trim().toLowerCase();
	return all.value.filter((m) => {
		if (element.value && m.element !== element.value) return false;
		if (archetype.value && m.archetype !== archetype.value) return false;
		if (stars.value && m.stars !== stars.value) return false;
		if (kw && !(m.name || '').toLowerCase().includes(kw) && !(m.family || '').toLowerCase().includes(kw)) return false;
		return true;
	});
});

const goDetail = (id) => {
	router.push(`/monster/${id}`);
};

onMounted(async () => {
	onLoading.value = true;
	try {
		const [list, zh] = await Promise.all([
			fetchMonsterList(),
			fetchZhNames().catch(() => null)
		]);
		// 简中覆盖仅中文语言生效(英文回退上游原文, 搜索随之支持双语)
		if (zh && isZh()) {
			for (const m of list) {
				const z = zh[m.id];
				if (!z) continue;
				if (z.n) m.name = z.n;
				if (z.f) m.family = z.f;
			}
		}
		all.value = list;
	} catch (e) {
		console.error('获取魔灵列表失败', e);
	} finally {
		onLoading.value = false;
	}
});
</script>

<style lang="less">
.monster_list {
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

	.filter_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 14px 16px;
		margin-bottom: 16px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.filter_row {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 14px 22px;
		}
		.filter_group {
			display: flex;
			align-items: center;
			gap: 8px;
			&.grow {
				flex: 1;
				min-width: 200px;
			}
			.filter_label {
				font-size: 13px;
				color: #606266;
				white-space: nowrap;
			}
			.filter_select {
				width: 110px;
			}
		}
		.elem_btns {
			display: flex;
			gap: 6px;
			flex-wrap: wrap;
		}
		.elem_btn {
			border: 1px solid #dcdfe6;
			background: #ffffff;
			color: #606266;
			border-radius: 6px;
			padding: 4px 12px;
			font-size: 13px;
			cursor: pointer;
			transition: all 0.15s;
			display: inline-flex;
			align-items: center;
			gap: 5px;
			.elem_btn_icon {
				width: 15px;
				height: 15px;
				object-fit: contain;
			}
			&:hover {
				border-color: #409eff;
				color: #409eff;
			}
			&.active {
				color: #ffffff;
				.elem_btn_icon { filter: brightness(1.6); }
			}
		}
	}

	.card_grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(118px, 1fr));
		gap: 12px;
	}

	.monster_card {
		background: #ffffff;
		border-radius: 10px;
		border-left: 4px solid #909399;
		padding: 10px 8px;
		cursor: pointer;
		text-align: center;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		transition: transform 0.15s, box-shadow 0.15s;
		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(31, 45, 61, 0.12);
		}
		.card_img img {
			width: 64px;
			height: 64px;
			object-fit: contain;
			image-rendering: auto;
		}
		.card_name {
			font-size: 13px;
			font-weight: 600;
			color: #303133;
			margin-top: 4px;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.card_meta {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 6px;
			margin-top: 2px;
			.elem_icon {
				width: 14px;
				height: 14px;
				object-fit: contain;
			}
			.card_stars {
				font-size: 10px;
				color: #d9a521;
				letter-spacing: 1px;
			}
		}
	}

	@media (max-width: 768px) {
		padding: 12px 12px 24px;
		.filter_card .filter_group .filter_select {
			width: 92px;
		}
	}
}
</style>
