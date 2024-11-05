<template>
	<div class="layout-header">
		<el-menu
			:default-active="activeIndex"
			class="header-nav"
			mode="horizontal"
			:ellipsis="false"
			:router="true"
			@select="handleSelect">
			<el-menu-item index="/">
				<!-- <span style="font-size: 20px;font-weight: 600;">首页</span> -->
			</el-menu-item>
			<div class="flex-grow"></div>
			<template v-for="(item, index) in navOption" :key="index">
				<el-menu-item v-if="(item.children || []).length === 0" :index="item.path || item.index">
					{{ item.name }}
				</el-menu-item>
				<el-sub-menu v-else :index="item.path || item.index">
					<template #title>{{ item.name }}</template>
					<template v-for="(child, cndex) in item.children" :key="cndex">
						<el-menu-item :index="child.path || child.index">{{ child.name }}</el-menu-item>
					</template>
				</el-sub-menu>
			</template>
		</el-menu>
		<div class="header-user" v-if="false">
			<div class="theme-btns">
				<el-switch
					v-model="themeValue"
					active-value="light"
					inactive-value="dark"
					@change="themeChange" />
			</div>
			<div class="user-info" v-if="userInfo.id">
				<img class="info-img" src="" alt="" />
				<div class="info-name">{{ userInfo.name }}</div>
			</div>
			<el-button type="primary" v-else>登录</el-button>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const activeIndex = ref('/game/coupon'); // 默认页签

const handleSelect = (key, keyPath) => {
	// 当用户点击时，更新 activeIndex
	localStorage.setItem('activeIndex', key); // 保存选择的页签
};

const navOption = [
	{
		name: '兑换码直兑',
		path: '/game/coupon',
		index: '1',
		children: []
	},
	{
		name: '留言板',
		path: '/game/message',
		index: '2',
		children: []
	}
];

const userInfo = ref({
	id: '',
	name: ''
});

const themeValue = ref('light');
function themeChange(e) {
	document.documentElement.setAttribute('theme', e);
}
// 在页面加载时获取 localStorage 中保存的 activeIndex
onMounted(() => {
	const savedIndex = localStorage.getItem('activeIndex');
	if (savedIndex) {
		activeIndex.value = savedIndex;
	}
});
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