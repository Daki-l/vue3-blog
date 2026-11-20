<template>
	<div class="not_found_wrapper">
		<el-empty :image-size="160" description="{{ t('notfound.title') }}">
			<div class="not_found_tip">{{ t('notfound.desc') }}</div>
			<el-button type="primary" @click="goHome">{{ t('common.backHome') }}</el-button>
		</el-empty>
	</div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { t } from '@/common/i18n';

const router = useRouter();

const goHome = () => {
	router.push('/home');
};
</script>

<style scoped lang="less">
.not_found_wrapper {
	min-height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: #ffffff;
	.not_found_tip {
		margin: 8px 0 16px;
		color: #909399;
		font-size: 13px;
	}
}
</style>
