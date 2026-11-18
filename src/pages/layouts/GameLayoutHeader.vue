<template>
	<div class="layout-header">
		<el-menu
			:default-active="activeIndex"
			class="header-nav"
			mode="horizontal"
			:ellipsis="false"
			:router="true">
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
			<template v-if="userStore.isLogged">
				<span class="user-name" :title="userStore.displayName">{{ userStore.displayName }}</span>
				<el-button v-if="userStore.isAdmin" type="primary" link @click="gotoAdmin">管理</el-button>
				<el-button type="danger" plain @click="handleLogout">退出</el-button>
			</template>
			<el-button type="primary" v-else @click="gotoLogin">登录</el-button>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// 高亮页签直接取当前路由,不再使用 localStorage 缓存
const activeIndex = computed(() => route.fullPath);

const baseNavOption = [
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
];

// 管理员额外显示"管理"菜单项
const navOption = computed(() => {
	if (userStore.isAdmin) {
		return baseNavOption.concat([
			{
				name: '管理',
				path: '/game/admin',
				index: '5',
				children: []
			}
		]);
	}
	return baseNavOption;
});

const gotoAdmin = () => {
	router.push('/game/admin');
};

const gotoLogin = () => {
	router.push({
		name: 'login',
		query: route.path === '/game/login' ? {} : { redirect: route.fullPath }
	});
};

const handleLogout = () => {
	userStore.logout();
	ElMessage.success('已退出登录');
	if (route.path.startsWith('/game/admin')) {
		router.push('/game/home');
	}
};
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
		background-color: #ffffff;
		width: 20%;
		height: var(--el-menu-horizontal-height);
		padding: 0 24px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		border-bottom: 1px solid var(--el-menu-border-color);
		.user-name {
			max-width: 140px;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
			color: #303133;
			font-size: 14px;
		}
	}
}
</style>
