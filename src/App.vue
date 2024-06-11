<template>
    <div class="layout-wrapper dark">
        <LayoutHeader></LayoutHeader>
        <div class="layout-content">
            <RouterView />
        </div>
        <div class="layout-footer"></div>
    </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router"
import LayoutHeader from "@/pages/layouts/LayoutHeader.vue"
</script>

<style scoped lang="less">
@import "./common/common.less";
.layout-wrapper {
    width: 100%;
    height: 100%;
    display: block;
    overflow: auto;
    .layout-header {}
    .layout-content {
        height: calc(100% - var(--el-menu-horizontal-height));
    }
    .layout-footer {}
}
</style>
