<template>
	<div class="admin_layout_wrapper">
		<el-container class="admin_container">
			<el-aside width="200px" class="admin_aside">
				<el-menu :default-active="activeMenu" router class="admin_menu">
					<el-menu-item index="/admin/dashboard">数据看板</el-menu-item>
					<el-menu-item index="/admin/coupons">兑换码管理</el-menu-item>
					<el-menu-item index="/admin/articles">文章管理</el-menu-item>
					<el-menu-item index="/admin/users">账号管理</el-menu-item>
					<el-menu-item index="/admin/summoners">召唤师管理</el-menu-item>
					<el-menu-item index="/admin/nav">导航管理</el-menu-item>
					<el-menu-item index="/admin/notices">公告管理</el-menu-item>
					<el-menu-item index="/admin/redemptions">兑换记录</el-menu-item>
					<el-menu-item index="/admin/auto-redeem">自动兑换</el-menu-item>
					<el-menu-item index="/admin/messages">留言管理</el-menu-item>
				</el-menu>
			</el-aside>
			<el-main class="admin_main">
				<router-view />
			</el-main>
		</el-container>
	</div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
// 高亮当前子页(/admin 前缀下的具体路径)
const activeMenu = computed(() => route.path);
</script>

<style lang="less">
.admin_layout_wrapper {
	min-height: 100%;
	background-color: #ffffff;
	.admin_container {
		min-height: 100%;
	}
	.admin_aside {
		border-right: solid 1px #e6e8eb;
		.admin_menu {
			border-right: none;
			height: 100%;
		}
	}
	.admin_main {
		padding: 12px 16px 24px;
		overflow-y: auto;
	}
	// 手机 web:侧栏改为顶部横向滚动菜单,main 占满剩余宽度
	@media (max-width: 768px) {
		.admin_container {
			flex-direction: column;
		}
		.admin_aside {
			// el-aside 通过 width prop 设置了行内宽度,需 !important 覆盖
			width: 100% !important;
			border-right: none;
			border-bottom: solid 1px #e6e8eb;
			.admin_menu {
				display: flex;
				flex-direction: row;
				align-items: center;
				height: auto;
				white-space: nowrap;
				overflow-x: auto;
				scrollbar-width: none;
				-ms-overflow-style: none;
				&::-webkit-scrollbar {
					display: none;
					height: 0;
				}
				.el-menu-item {
					flex-shrink: 0;
					height: 48px;
					line-height: 48px;
					padding: 0 14px;
				}
			}
		}
		.admin_main {
			padding: 12px 8px 16px;
			overflow: visible;
		}
	}
}
</style>
