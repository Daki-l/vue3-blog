<template>
    <div class="layout-header">
        <el-menu
            :default-active="activeIndex"
            class="header-nav"
            mode="horizontal"
            :ellipsis="false"
            :router="true"
            @select="handleSelect"
        >
            <el-menu-item index="/">
                <span style="font-size: 20px;font-weight: 600;">首页</span>
            </el-menu-item>
            <div class="flex-grow"></div>
            <template v-for="(item, index) in navOption" :key="index">
                <el-menu-item v-if="(item.children || []).length === 0" :index="item.path || item.index">{{ item.name }}</el-menu-item>
                <el-sub-menu v-else :index="item.path || item.index" >
                    <template #title>{{ item.name }}</template>
                    <template v-for="(child, cndex) in item.children" :key="cndex">
                        <el-menu-item :index="child.path || child.index">{{ child.name }}</el-menu-item>
                    </template>
                </el-sub-menu>
            </template>
        </el-menu>
        <div class="header-user">
            <div class="theme-btns">
                <el-switch
                    v-model="themeValue"
                    active-value="light"
                    inactive-value="dark"
                    @change="themeChange"
                    />
            </div>
            <!-- <div class="user-info" v-if="userInfo.id">
                <img class="info-img" src="" alt="">
                <div class="info-name">{{ userInfo.name }}</div>
            </div>
            <el-button type="primary" v-else>登录</el-button> -->
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue"

const activeIndex = '/coupon'
const handleSelect = (key, keyPath) => {
    // console.log(key, keyPath)
    // console.log(activeIndex);
    
}

const navOption = [
    {
        name: '兑换码直兑',
        path: '/coupon',
        index: '1',
        children: []
    }
]

const userInfo = ref({
    id: '',
    name: ''
})

const themeValue = ref('light');
function themeChange(e) {
    document.documentElement.setAttribute('theme', e)
}


</script>

<style lang="less">
.layout-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .header-nav {
        width: 80%;
    }
    .header-user {
        width: 20%;
        height: var(--el-menu-horizontal-height);
        padding: 0 24px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        border-bottom: 1px solid var(--el-menu-border-color);
    }
}
</style>