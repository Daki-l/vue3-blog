<template>
	<div class="pvp_detail">
		<div class="page_header">
			<span class="page_title">{{ t('pvp.defenseTitle') }}</span>
			<div class="header_btns">
				<el-button link @click="router.push('/3v3')">{{ t('pvp.backSearch') }}</el-button>
				<el-button link @click="router.back()">{{ t('common.back') }}</el-button>
			</div>
		</div>
		<DefensePanel :dkey="key" />
	</div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DefensePanel from '@/components/pvp/DefensePanel.vue';
import { t } from '@/common/i18n';

const route = useRoute();
const router = useRouter();
const key = computed(() => String(route.params.key || ''));
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
		.header_btns {
			display: flex;
			gap: 4px;
		}
	}

	@media (max-width: 768px) {
		padding: 12px 12px 24px;
	}
}
</style>
