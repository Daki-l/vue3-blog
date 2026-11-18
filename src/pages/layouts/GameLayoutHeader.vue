<template>
	<div class="layout-header">
		<el-menu
			:default-active="activeIndex"
			class="header-nav"
			mode="horizontal"
			:ellipsis="false"
			:router="true">
			<template v-for="item in navOption" :key="item.id">
				<el-sub-menu v-if="(item.children || []).length > 0" :index="menuIndex(item)">
					<template #title>{{ item.name }}</template>
					<el-menu-item
						v-for="child in item.children"
						:key="child.id"
						:index="menuIndex(child)">
						{{ child.name }}
					</el-menu-item>
				</el-sub-menu>
				<el-menu-item v-else :index="menuIndex(item)">{{ item.name }}</el-menu-item>
			</template>
		</el-menu>
		<div class="header-user">
			<template v-if="userStore.isLogged">
				<el-dropdown class="user_dropdown" trigger="click" @command="handleUserCommand">
					<span class="user_trigger" :title="userStore.displayName">
						<span class="user-name">{{ userStore.displayName }}</span>
						<span class="user-caret">▾</span>
					</span>
					<template #dropdown>
						<el-dropdown-menu>
							<el-dropdown-item command="profile">个人中心</el-dropdown-item>
							<el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
						</el-dropdown-menu>
					</template>
				</el-dropdown>
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
import { useNavStore } from '@/stores/nav';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const navStore = useNavStore();

// 菜单高亮:普通页取完整路径(含 query,如 /info/scene?id=11);管理页统一高亮"管理"
const activeIndex = computed(() => {
	if (route.path.startsWith('/admin')) {
		return '/admin';
	}
	return route.fullPath;
});

// 菜单项 index:有路径用路径(router 模式直接跳转),无路径(纯分组的父级)用 id 兜底
const menuIndex = (item) => item.path || `nav-${item.id}`;

// 导航数据驱动(两级树);管理员追加"管理"入口
const navOption = computed(() => {
	if (userStore.isAdmin) {
		return (navStore.tree || []).concat([
			{
				id: 'admin-entry',
				name: '管理',
				path: '/admin',
				children: []
			}
		]);
	}
	return navStore.tree || [];
});

const handleUserCommand = (command) => {
	if (command === 'profile') {
		router.push('/profile');
		return;
	}
	if (command === 'logout') {
		userStore.logout();
		ElMessage.success('已退出登录');
		if (route.path.startsWith('/admin') || route.path.startsWith('/profile')) {
			router.push('/home');
		}
	}
};

const gotoLogin = () => {
	router.push({
		name: 'login',
		query: route.path === '/login' ? {} : { redirect: route.fullPath }
	});
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
		.user_dropdown {
			cursor: pointer;
			outline: none;
		}
		.user_trigger {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			max-width: 200px;
			color: #303133;
			font-size: 14px;
		}
		.user-name {
			max-width: 160px;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
		.user-caret {
			color: #909399;
			font-size: 12px;
		}
	}
}
</style>
