<template>
	<div class="layout-wrapper">
		<LayoutHeader></LayoutHeader>
		<div class="layout-content">
			<RouterView />
            <LayoutFooter></LayoutFooter>
		</div>
	</div>
</template>

<script setup lang="ts">
import LayoutHeader from "@/pages/layouts/LayoutHeader.vue";
import LayoutFooter from "@/pages/layouts/LayoutFooter.vue";
</script>

<style scoped lang="less">
@import './common/common.less';
.layout-wrapper {
	width: 100%;
	height: 100vh;
	display: block;
	overflow: auto;
	.layout-header {
	}
	.layout-content {
		height: calc(100% - var(--el-menu-horizontal-height));
        overflow-y: auto;
	}
	.layout-footer {
	}
}
</style>
