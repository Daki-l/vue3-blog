<template>
	<div class="layout-header">
		<el-menu
			:default-active="activeIndex"
			class="header-nav"
			mode="horizontal"
			:ellipsis="false"
			:router="true"
			@select="handleSelect">
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
		<div class="header-user">
			<!-- <div class="theme-btns">
				<el-switch
					v-model="themeValue"
					active-value="light"
					inactive-value="dark"
					@change="themeChange" />
			</div> -->
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
const ENV = ref(import.meta.env);

const handleSelect = (key, keyPath) => {
	// 当用户点击时，更新 activeIndex
	localStorage.setItem('activeIndex', key); // 保存选择的页签
};

const navOption = ref([
	{
		name: '首页',
		path: '/game/home',
		index: '1',
		children: []
	},
	{
		name: '地下城介绍',
		path: '/game/info/',
		index: '2',
		children: [
			{
				name: '巨人地下城',
				desction: 'giant',
				path: '/game/info/scene?id=11',
				index: '2-1'
			},
			{
				name: '龙之地下城',
				desction: 'dragon',
				path: '/game/info/scene?id=12',
				index: '2-1'
			},
			{
				name: '死亡地下城',
				desction: 'necropolis',
				path: '/game/info/scene?id=13',
				index: '2-2'
			},
			{
				name: '精灵地下城',
				desction: 'spiritual',
				path: '/game/info/scene?id=14',
				index: '2-3'
			},
			{
				name: '钢铁地下城',
				desction: 'steel',
				path: '/game/info/scene?id=15',
				index: '2-4'
			},
			{
				name: '惩罚者地下城',
				desction: 'punisher',
				path: '/game/info/scene?id=16',
				index: '2-5'
			}
		]
	},
	{
		name: '兑换码直兑',
		path: '/game/coupon',
		index: '4',
		children: []
	},
	{
		name: '留言板',
		path: '/game/message',
		index: '3',
		children: []
	}
	// {
	// 	name: '资源',
	// 	path: '/game/static',
	// 	index: '5'
	// }
]);
console.log('ENV.value.MODE;;---', ENV.value);
if (ENV.value.MODE === 'development') {
	navOption.value.push({
		name: '操作',
		path: '/game/action',
		index: '4'
	});
}
const userInfo = ref({
	id: '123',
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
        background-color: #FFFFFF;
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