<template>
    <div class="blog_layout_wrapper">
        <LayoutHeader></LayoutHeader>
        <div class="layout-content">
            <RouterView />
        </div>
        <LayoutFooter></LayoutFooter>
    </div>
</template>

<script setup>
import LayoutHeader from "@/pages/layouts/LayoutHeader.vue";
import LayoutFooter from "@/pages/layouts/LayoutFooter.vue";
</script>

<style lang="less">
.blog_layout_wrapper {
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