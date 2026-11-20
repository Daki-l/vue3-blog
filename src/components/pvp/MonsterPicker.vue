<template>
	<div class="mp_picker" ref="root">
		<div class="mp_trigger" :class="{ open }" @click="toggle">
			<template v-if="sel">
				<img class="mp_avatar" :src="monsterImg(sel.image)" :alt="sel.name" />
				<span class="mp_name">{{ sel.name }}</span>
				<img class="mp_elem" :src="elementIconUrl(sel.element)" />
				<span class="mp_clear" @click.stop="clear">×</span>
			</template>
			<span v-else class="mp_ph">{{ placeholder }}</span>
			<span class="mp_arrow" :class="{ up: open }">▾</span>
		</div>

		<Teleport to="body">
			<div v-show="open" class="mp_panel" ref="panelRef">
				<div class="mp_filters">
					<div class="mp_elem_row">
						<button class="mp_ebtn" :class="{ on: !element }" @click="element = ''">{{ t('common.all') }}</button>
						<button
							v-for="e in ELEMENTS" :key="e.value"
							class="mp_ebtn ico" :class="{ on: element === e.value }"
							:style="element === e.value ? { borderColor: e.color, boxShadow: `0 0 0 1px ${e.color}` } : {}"
							@click="element = e.value">
							<img :src="elementIconUrl(e.value)" :alt="e.value" />
						</button>
					</div>
					<div class="mp_sel_row">
						<el-select v-model="archetype" size="small" clearable :teleported="false" :placeholder="t('monster.archetype')" class="mp_arch">
							<el-option v-for="a in ARCHETYPES" :key="a" :label="t('arch.' + a)" :value="a" />
						</el-select>
						<el-select v-model="stars" size="small" clearable :teleported="false" :placeholder="t('monster.stars')" class="mp_stars">
							<el-option v-for="s in 5" :key="s" :label="s + ' ' + t('monster.starsUnit')" :value="s" />
						</el-select>
						<el-input v-model="kw" size="small" clearable :placeholder="t('monster.searchPlaceholder')" class="mp_kw" />
					</div>
				</div>

				<div class="mp_list">
					<div
						v-for="m in shown" :key="m.id"
						class="mp_item" :class="{ sel: m.id === modelValue }"
						@click="choose(m)">
						<img class="mp_iavatar" :src="monsterImg(m.image)" loading="lazy" :alt="m.name" />
						<span class="mp_iname">{{ m.name }}</span>
						<span class="mp_istars">{{ '★'.repeat(m.stars || 0) }}</span>
						<img class="mp_ielem" :src="elementIconUrl(m.element)" />
					</div>
					<div v-if="!filtered.length" class="mp_empty">{{ t('monster.empty') }}</div>
				</div>
				<div class="mp_foot">{{ t('monster.count', filtered.length) }}</div>
			</div>
		</Teleport>
	</div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { monsterImg, elementIconUrl, ELEMENTS, ARCHETYPES } from '@/services/monster';
import { t } from '@/common/i18n';

const props = defineProps({
	modelValue: { type: Number, default: null },
	monsters: { type: Array, default: () => [] },
	placeholder: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue', 'change']);

const root = ref(null);
const panelRef = ref(null);
const open = ref(false);
const element = ref('');
const archetype = ref('');
const stars = ref(null);
const kw = ref('');

const sel = computed(() => props.monsters.find((m) => m.id === props.modelValue) || null);

/** 与魔灵图鉴同维度筛选(元素/类型/星级/关键词),zh 覆盖后中文名可搜,name_en 兼容英文检索 */
const filtered = computed(() => {
	const k = kw.value.trim().toLowerCase();
	return props.monsters.filter((m) => {
		if (element.value && m.element !== element.value) return false;
		if (archetype.value && m.archetype !== archetype.value) return false;
		if (stars.value && m.stars !== stars.value) return false;
		if (k) {
			const name = (m.name || '').toLowerCase();
			const nameEn = (m.name_en || '').toLowerCase();
			if (!name.includes(k) && !nameEn.includes(k)) return false;
		}
		return true;
	});
});

// 上限保护:全量 945 只不至于卡,但仍截断首屏渲染量
const shown = computed(() => filtered.value.slice(0, 200));

/**
 * 面板 teleport 到 body + fixed 定位:
 * 页面容器(.layout-content)带 overflow:auto,普通 absolute 会被祖先裁切,
 * 挂 body 下按触发器位置计算,并对视口钳制(左右留 8px,下方放不下翻上方)。
 */
const placePanel = () => {
	const rootEl = root.value;
	const panel = panelRef.value;
	if (!rootEl || !panel) return;
	const trig = rootEl.querySelector('.mp_trigger');
	if (!trig) return;
	const tr = trig.getBoundingClientRect();
	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const w = Math.min(400, vw - 16);
	let left = tr.left + tr.width / 2 - w / 2;
	left = Math.max(8, Math.min(left, vw - 8 - w));
	const estH = Math.min(460, vh - 16);
	let top = tr.bottom + 6;
	if (top + estH > vh - 8) top = Math.max(8, tr.top - estH - 6);
	panel.style.width = w + 'px';
	panel.style.left = Math.round(left) + 'px';
	panel.style.top = Math.round(top) + 'px';
};

const toggle = async () => {
	open.value = !open.value;
	if (open.value) {
		await nextTick();
		placePanel();
	}
};

const choose = (m) => {
	emit('update:modelValue', m.id);
	emit('change', m.id);
	open.value = false;
};

const clear = () => {
	emit('update:modelValue', null);
	emit('change', null);
	open.value = false;
};

const onDocDown = (e) => {
	// 面板已 teleport 到 body,触发器与面板之外的点击都视为关闭
	if (root.value?.contains(e.target)) return;
	if (panelRef.value?.contains(e.target)) return;
	open.value = false;
};
const onReposition = () => { if (open.value) placePanel(); };
onMounted(() => {
	document.addEventListener('mousedown', onDocDown);
	window.addEventListener('resize', onReposition);
	// capture 捕获内层滚动容器(.layout-content)的滚动,fixed 面板随触发器重算位置
	document.addEventListener('scroll', onReposition, true);
});
onBeforeUnmount(() => {
	document.removeEventListener('mousedown', onDocDown);
	window.removeEventListener('resize', onReposition);
	document.removeEventListener('scroll', onReposition, true);
});
</script>

<style lang="less">
.mp_picker {
	.mp_trigger {
		display: flex;
		align-items: center;
		gap: 6px;
		min-height: 32px;
		padding: 2px 10px;
		background: #fff;
		border: 1px solid #dcdfe6;
		border-radius: 6px;
		cursor: pointer;
		transition: border-color 0.15s;
		&:hover,
		&.open {
			border-color: #409eff;
		}
		.mp_avatar {
			width: 24px;
			height: 24px;
			object-fit: contain;
			flex-shrink: 0;
		}
		.mp_name {
			flex: 1;
			font-size: 13px;
			color: #303133;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		.mp_elem {
			width: 14px;
			height: 14px;
			object-fit: contain;
			flex-shrink: 0;
		}
		.mp_ph {
			flex: 1;
			font-size: 13px;
			color: #a8abb2;
		}
		.mp_clear {
			width: 16px;
			height: 16px;
			line-height: 14px;
			text-align: center;
			border-radius: 50%;
			color: #909399;
			font-size: 13px;
			flex-shrink: 0;
			&:hover {
				background: #909399;
				color: #fff;
			}
		}
		.mp_arrow {
			color: #a8abb2;
			font-size: 12px;
			flex-shrink: 0;
			transition: transform 0.15s;
			&.up {
				transform: rotate(180deg);
			}
		}
	}
}

// teleport 到 body 的弹层:fixed 定位,位置由 placePanel() 按触发器计算
.mp_panel {
	position: fixed;
	width: 400px;
	background: #fff;
	border: 1px solid #e4e7ed;
	border-radius: 8px;
	box-shadow: 0 8px 24px rgba(31, 45, 61, 0.16);
	z-index: 3000;
	padding: 8px;

	.mp_filters {
		border-bottom: 1px solid #ebeef5;
		padding-bottom: 8px;
	}
	.mp_elem_row {
		display: flex;
		gap: 6px;
		margin-bottom: 8px;
		.mp_ebtn {
			height: 26px;
			min-width: 44px;
			padding: 0 8px;
			border: 1px solid #dcdfe6;
			border-radius: 5px;
			background: #fff;
			color: #606266;
			font-size: 12px;
			cursor: pointer;
			&.ico {
				min-width: 0;
				padding: 0 5px;
				display: flex;
				align-items: center;
				img {
					width: 16px;
					height: 16px;
					object-fit: contain;
				}
			}
			&.on {
				border-color: #409eff;
				color: #409eff;
			}
		}
	}
	.mp_sel_row {
		display: flex;
		gap: 6px;
		position: relative;
		.mp_arch {
			width: 110px;
			flex-shrink: 0;
		}
		.mp_stars {
			width: 92px;
			flex-shrink: 0;
		}
		.mp_kw {
			flex: 1;
			min-width: 80px;
		}
	}

	.mp_list {
		max-height: 300px;
		overflow-y: auto;
		.mp_item {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 5px 8px;
			border-radius: 6px;
			cursor: pointer;
			&:hover {
				background: #f5f7fa;
			}
			&.sel {
				background: #ecf5ff;
			}
			.mp_iavatar {
				width: 26px;
				height: 26px;
				object-fit: contain;
				flex-shrink: 0;
			}
			.mp_iname {
				flex: 1;
				font-size: 13px;
				color: #303133;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
			.mp_istars {
				font-size: 10px;
				color: #e6a23c;
				flex-shrink: 0;
			}
			.mp_ielem {
				width: 14px;
				height: 14px;
				object-fit: contain;
				flex-shrink: 0;
			}
		}
		.mp_empty {
			padding: 24px 0;
			text-align: center;
			font-size: 12px;
			color: #909399;
		}
	}

	.mp_foot {
		border-top: 1px solid #ebeef5;
		padding-top: 6px;
		margin-top: 6px;
		font-size: 11px;
		color: #c0c4cc;
		text-align: right;
	}
}
</style>
