<template>
    <div class="layout-wrapper dark">
        <LayoutHeader></LayoutHeader>
        <div class="layout-content">
            <RouterView />
        </div>
        <div class="layout-footer"></div>
    </div>
</template>

<script>
// import { getArticleList } from "./services/articleService/index.ts"
import { getArticleList } from "@/services/articleService"
export default {
    mounted() {
        console.log("xxx---")
        getArticleList().then((res) => {
            console.log("res---", res)
        })
    }
}
</script>

<style scoped lang="less">
@import "./common/common.less";
.layout-wrapper {
    width: 100%;
    height: 100%;
    display: block;
    overflow: auto;
    .layout-header {
    }
    .layout-content {
        height: calc(100% - var(--el-menu-horizontal-height));
    }
    .layout-footer {
    }
}
</style>
