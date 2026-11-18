<template>
	<div class="admin_users_wrapper">
		<div class="page_header">
			<span class="page_title">账号管理</span>
			<div class="search_form">
				<el-input
					v-model="keyword"
					placeholder="用户名/昵称关键词"
					class="search_input"
					clearable
					@keyup.enter="handleSearch" />
				<el-button type="primary" @click="handleSearch">搜索</el-button>
			</div>
		</div>
		<el-table :data="userList" border style="width: 100%" v-loading="listLoading">
			<el-table-column prop="id" label="ID" width="70" sortable />
			<el-table-column prop="username" label="用户名" min-width="140">
				<template #default="{ row }">
					<span>{{ row.username }}</span>
					<el-tag v-if="isSelf(row)" size="small" type="warning" class="self_tag">我自己</el-tag>
				</template>
			</el-table-column>
			<el-table-column prop="nickname" label="昵称" min-width="120">
				<template #default="{ row }">{{ row.nickname || '-' }}</template>
			</el-table-column>
			<el-table-column label="角色" width="100">
				<template #default="{ row }">
					<el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
						{{ row.role === 'admin' ? '管理员' : '用户' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="状态" width="90">
				<template #default="{ row }">
					<el-tag :type="row.status === 'active' ? 'success' : 'danger'">
						{{ row.status === 'active' ? '正常' : '已封禁' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column prop="createdAt" label="注册时间" width="170">
				<template #default="{ row }">{{ row.createdAt || row.created_at || '-' }}</template>
			</el-table-column>
			<el-table-column label="操作" width="300" align="right">
				<template #default="{ row }">
					<el-button
						type="warning"
						link
						:disabled="isSelf(row)"
						@click="toggleStatus(row)">
						{{ row.status === 'active' ? '封禁' : '解封' }}
					</el-button>
					<el-button
						type="primary"
						link
						:disabled="isSelf(row)"
						@click="toggleRole(row)">
						{{ row.role === 'admin' ? '降为用户' : '设为管理员' }}
					</el-button>
					<el-button type="primary" link :disabled="isSelf(row)" @click="handleResetPassword(row)">
						重置密码
					</el-button>
					<el-button type="danger" link :disabled="isSelf(row)" @click="handleDelete(row)">
						删除
					</el-button>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无用户" :image-size="80" />
			</template>
		</el-table>

		<!-- 重置密码结果弹窗 -->
		<el-dialog v-model="passwordDialogVisible" title="重置密码成功" width="440">
			<el-alert
				title="一次性密码仅展示这一次，请立即复制并转交用户"
				type="warning"
				show-icon
				:closable="false"
				class="password_alert" />
			<div class="password_value">{{ resetPasswordValue }}</div>
			<template #footer>
				<el-button @click="passwordDialogVisible = false">关闭</el-button>
				<el-button type="primary" @click="copyResetPassword">复制密码</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
	getAdminUsers,
	updateAdminUser,
	resetAdminUserPassword,
	deleteAdminUser
} from '@/services/admin';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const userList = ref([]);
const listLoading = ref(false);
const keyword = ref('');

const passwordDialogVisible = ref(false);
const resetPasswordValue = ref('');

const isSelf = (row) => {
	return Number(row.id) === Number(userStore.user?.id);
};

const initUserList = async () => {
	listLoading.value = true;
	try {
		const params = {};
		if (keyword.value.trim()) {
			params.keyword = keyword.value.trim();
		}
		const res = await getAdminUsers(params);
		userList.value = res?.list || [];
	} catch (e) {
		console.error('获取用户列表失败', e);
	} finally {
		listLoading.value = false;
	}
};

const handleSearch = () => {
	initUserList();
};

// 封禁/解封
const toggleStatus = (row) => {
	const nextStatus = row.status === 'active' ? 'banned' : 'active';
	const actionText = nextStatus === 'banned' ? '封禁' : '解封';
	ElMessageBox.confirm(`确认${actionText}用户「${row.username}」？`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning'
	})
		.then(async () => {
			try {
				await updateAdminUser(row.id, { status: nextStatus });
				ElMessage.success(`已${actionText}`);
				initUserList();
			} catch (e) {
				// 错误提示由 axios 拦截器统一处理
			}
		})
		.catch(() => {});
};

// 角色切换
const toggleRole = (row) => {
	const nextRole = row.role === 'admin' ? 'user' : 'admin';
	const actionText = nextRole === 'admin' ? '设为管理员' : '降为普通用户';
	ElMessageBox.confirm(`确认将用户「${row.username}」${actionText}？`, '提示', {
		confirmButtonText: '确认',
		cancelButtonText: '取消',
		type: 'warning'
	})
		.then(async () => {
			try {
				await updateAdminUser(row.id, { role: nextRole });
				ElMessage.success('角色已更新');
				initUserList();
			} catch (e) {
				// 错误提示由 axios 拦截器统一处理
			}
		})
		.catch(() => {});
};

// 重置密码
const handleResetPassword = async (row) => {
	try {
		const res = await resetAdminUserPassword(row.id);
		resetPasswordValue.value = res?.password || '';
		if (!resetPasswordValue.value) {
			ElMessage.error('未获取到新密码');
			return;
		}
		passwordDialogVisible.value = true;
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	}
};

const copyResetPassword = async () => {
	try {
		await navigator.clipboard.writeText(resetPasswordValue.value);
		ElMessage.success('已复制到剪贴板');
	} catch (e) {
		// 剪贴板不可用时退回选中提示
		ElMessage.warning(`复制失败，请手动复制：${resetPasswordValue.value}`);
	}
};

// 删除用户
const handleDelete = (row) => {
	ElMessageBox.confirm(
		`确认删除用户「${row.username}」？该操作会同时删除其绑定的 Hive 账号，不可恢复！`,
		'危险操作',
		{
			confirmButtonText: '确认删除',
			cancelButtonText: '取消',
			type: 'error'
		}
	)
		.then(async () => {
			try {
				await deleteAdminUser(row.id);
				ElMessage.success('已删除');
				initUserList();
			} catch (e) {
				// 错误提示由 axios 拦截器统一处理
			}
		})
		.catch(() => {});
};

onMounted(() => {
	initUserList();
});
</script>

<style lang="less">
.admin_users_wrapper {
	.page_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 12px;
		.page_title {
			font-size: 18px;
			font-weight: 600;
		}
		.search_form {
			display: flex;
			align-items: center;
			gap: 8px;
			.search_input {
				width: 240px;
			}
		}
	}
	.self_tag {
		margin-left: 6px;
	}
	.password_alert {
		margin-bottom: 12px;
	}
	.password_value {
		font-size: 20px;
		font-weight: 600;
		letter-spacing: 2px;
		text-align: center;
		padding: 12px;
		background: #f5f7fa;
		border-radius: 4px;
		user-select: all;
	}
}
</style>
