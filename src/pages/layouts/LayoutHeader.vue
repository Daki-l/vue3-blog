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
                <img style="width: 100px" src="https://element-plus.org/images/element-plus-logo.svg" alt="Element logo" />
            </el-menu-item>
            <div class="flex-grow"></div>
            <template v-for="(item, index) in nanOption" :key="index">
                <el-menu-item v-if="(item.children || []).length === 0" :index="item.path || item.index">{{ item.name }}</el-menu-item>
                <el-sub-menu v-else :index="item.path || item.index" >
                    <template #title>{{ item.name }}</template>
                    <template v-for="(child, cndex) in item.children" :key="cndex">
                        <el-sub-menu :index="child.path || child.index" >
                            <template #title>{{ child.name }}</template>
                        </el-sub-menu>
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
            <div class="user-info" v-if="userInfo.id">
                <img class="info-img" src="" alt="">
                <div class="info-name">{{ userInfo.name }}</div>
            </div>
            <el-button type="primary" v-else>登录</el-button>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue"

const activeIndex = '/home'
const handleSelect = (key, keyPath) => {
    // console.log(key, keyPath)
    // console.log(activeIndex);
    
}

const nanOption = [
    {
        name: '首页',
        path: '/home',
        index: '1',
        children: []
    },
    {
        name: "文章",
        path: '/article',
        index: '2',
        children: []
    },
    {
        name: "关于",
        path: '/about',
        index: '3',
        children: []
    },
    {
        name: "other",
        path: '/other',
        index: '4',
        children: [
            {
                name: "one",
                path: '/one',
                index: '4-1',
            },
            {
                name: "two",
                path: '/two',
                index: '4-3',
            },
            {
                name: "thire",
                path: '/thire',
                index: '4-3',
            },
        ]
    },
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