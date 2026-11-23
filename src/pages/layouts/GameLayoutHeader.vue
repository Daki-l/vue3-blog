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
			<!-- 语言切换:zh/EN 两段小开关 -->
			<div class="locale_switch" :title="t('common.language')">
				<span
					v-for="l in LOCALES"
					:key="l.value"
					class="locale_opt"
					:class="{ active: l.value === locale }"
					@click="setLocale(l.value)">
					{{ l.label }}
				</span>
			</div>
			<template v-if="userStore.isLogged">
				<el-dropdown class="user_dropdown" trigger="click" @command="handleUserCommand">
					<span class="user_trigger" :title="userStore.displayName">
						<span class="user-name">{{ userStore.displayName }}</span>
						<span class="user-caret">▾</span>
					</span>
					<template #dropdown>
						<el-dropdown-menu>
							<el-dropdown-item command="profile">{{ t('common.profile') }}</el-dropdown-item>
							<el-dropdown-item command="logout" divided>{{ t('common.logout') }}</el-dropdown-item>
						</el-dropdown-menu>
					</template>
				</el-dropdown>
			</template>
			<el-button type="primary" v-else @click="gotoLogin">{{ t('common.login') }}</el-button>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { useNavStore } from '@/stores/nav';
import { t, navName, LOCALES, locale, setLocale } from '@/common/i18n';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const navStore = useNavStore();

// 菜单高亮:普通页取完整路径(含 query,如 /info/scene?id=11);管理页统一高亮"管理";
// 符文管理带定位参数(/rune?unit=)时仍高亮该页签
const activeIndex = computed(() => {
	if (route.path.startsWith('/admin')) {
		return '/admin';
	}
	if (route.path === '/rune') {
		return '/rune';
	}
	return route.fullPath;
});

// 菜单项 index:有路径用路径(router 模式直接跳转),无路径(纯分组的父级)用 id 兜底
const menuIndex = (item) => item.path || `nav-${item.id}`;

// 固定入口:个人中心(所有用户可见,未登录点击由路由守卫跳登录)
const profileEntry = {
	id: 'profile-entry',
	name: t('common.profile'),
	path: '/profile',
	children: []
};

// 导航数据驱动(两级树);尾部追加"个人中心",管理员再追加"管理"入口;名称按语言映射
const navOption = computed(() => {
	const base = (navStore.tree || []).map((item) => ({
		...item,
		name: navName(item.name),
		children: (item.children || []).map((c) => ({ ...c, name: navName(c.name) }))
	}));
	if (userStore.isAdmin) {
		return base.concat([profileEntry], [
			{
				id: 'admin-entry',
				name: t('common.admin'),
				path: '/admin',
				children: []
			}
		]);
	}
	return base.concat([profileEntry]);
});

const handleUserCommand = (command) => {
	if (command === 'profile') {
		router.push('/profile');
		return;
	}
	if (command === 'logout') {
		userStore.logout();
		ElMessage.success(t('common.loggedOut'));
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
		// 语言切换:两段小开关
		.locale_switch {
			display: inline-flex;
			align-items: center;
			border: 1px solid var(--el-menu-border-color);
			border-radius: 4px;
			overflow: hidden;
			flex-shrink: 0;
			.locale_opt {
				padding: 2px 8px;
				font-size: 12px;
				line-height: 18px;
				color: #606266;
				cursor: pointer;
				user-select: none;
				& + .locale_opt {
					border-left: 1px solid var(--el-menu-border-color);
				}
				&.active {
					background-color: var(--el-color-primary);
					color: #fff;
				}
			}
		}
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
	// 手机 web:菜单横向滑动,用户区压缩
	@media (max-width: 768px) {
		.header-nav {
			flex: 1 1 auto;
			width: auto;
			min-width: 0;
			overflow-x: auto;
			overflow-y: hidden;
			scrollbar-width: none;
			-ms-overflow-style: none;
			&::-webkit-scrollbar {
				display: none;
				height: 0;
			}
			> li {
				flex-shrink: 0;
			}
		}
		.header-user {
			flex: 0 0 auto;
			width: auto;
			padding: 0 10px;
			.user_trigger {
				max-width: none;
			}
			.user-name {
				max-width: 60px;
			}
		}
	}
}
</style>
