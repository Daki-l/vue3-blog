<template>
	<el-config-provider :locale="epLocale">
		<RouterView />
	</el-config-provider>
</template>

<script setup>
import { onMounted } from 'vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import en from 'element-plus/es/locale/lang/en';
import { useNavStore } from '@/stores/nav';
import { locale } from '@/common/i18n';

// element-plus 内置组件文案(分页/空态等)随语言切换(reload 生效)
const epLocale = locale === 'zh' ? zhCn : en;

// 启动时拉取导航数据(失败时 store 内部回退默认常量)
onMounted(() => {
	useNavStore().init();
});
</script>

<style scoped lang="less">
@import './common/common.less';
</style>
