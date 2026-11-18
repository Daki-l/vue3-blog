<template>
	<RouterView />
</template>

<script setup>
import { onMounted } from 'vue';
import { useNavStore } from '@/stores/nav';

// 启动时拉取导航数据(失败时 store 内部回退默认常量)
onMounted(() => {
	useNavStore().init();
});
</script>

<style scoped lang="less">
@import './common/common.less';
</style>
