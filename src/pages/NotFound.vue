<template>
	<div class="not_found_wrapper">
		<el-empty :image-size="160" description="页面不存在或已被移动 (404)">
			<div class="not_found_tip">你访问的地址没有对应页面，可能已迁移到新路径</div>
			<el-button type="primary" @click="goHome">返回首页</el-button>
		</el-empty>
	</div>
</template>

<script setup>
import { useRouter } from 'vue-router';

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
