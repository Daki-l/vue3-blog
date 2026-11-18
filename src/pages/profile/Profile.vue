<template>
	<div class="profile_wrapper">
		<div class="page_title">个人中心</div>

		<!-- 区块1 基本信息 -->
		<el-card shadow="never" class="section_card" v-loading="baseLoading">
			<template #header><span class="section_title">基本信息</span></template>
			<el-descriptions :column="2" border>
				<el-descriptions-item label="用户名">
					{{ userStore.user?.username || '-' }}
				</el-descriptions-item>
				<el-descriptions-item label="角色">
					<el-tag :type="userStore.isAdmin ? 'danger' : 'info'">
						{{ userStore.isAdmin ? '管理员' : '普通用户' }}
					</el-tag>
				</el-descriptions-item>
				<el-descriptions-item label="注册时间">
					{{ formatDateTime(userStore.user?.createdAt || userStore.user?.created_at) }}
				</el-descriptions-item>
				<el-descriptions-item label="昵称">
					<div class="nickname_row">
						<template v-if="!nicknameEditing">
							<span>{{ userStore.displayName || '-' }}</span>
							<el-button type="primary" link @click="startEditNickname">编辑</el-button>
						</template>
						<template v-else>
							<el-input
								v-model="nicknameForm"
								maxlength="20"
								placeholder="1-20 个字符"
								class="nickname_input"
								@keyup.enter="submitNickname" />
							<el-button type="primary" :loading="nicknameSaving" @click="submitNickname">
								保存
							</el-button>
							<el-button @click="cancelEditNickname">取消</el-button>
						</template>
					</div>
				</el-descriptions-item>
			</el-descriptions>
		</el-card>

		<!-- 区块2 修改密码 -->
		<el-card shadow="never" class="section_card">
			<template #header><span class="section_title">修改密码</span></template>
			<el-form
				ref="passwordFormRef"
				:model="passwordForm"
				:rules="passwordRules"
				label-width="100px"
				class="password_form">
				<el-form-item label="旧密码" prop="oldPassword">
					<el-input
						v-model="passwordForm.oldPassword"
						type="password"
						show-password
						placeholder="请输入旧密码" />
				</el-form-item>
				<el-form-item label="新密码" prop="newPassword">
					<el-input
						v-model="passwordForm.newPassword"
						type="password"
						show-password
						placeholder="至少 8 位" />
				</el-form-item>
				<el-form-item label="确认新密码" prop="confirmPassword">
					<el-input
						v-model="passwordForm.confirmPassword"
						type="password"
						show-password
						placeholder="再次输入新密码" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" :loading="passwordSaving" @click="submitPassword">
						修改密码
					</el-button>
				</el-form-item>
			</el-form>
		</el-card>

		<!-- 区块3 我的 Hive 账号 -->
		<el-card shadow="never" class="section_card">
			<template #header><span class="section_title">我的 Hive 账号</span></template>
			<div class="hive_add_form">
				<el-input
					v-model="hiveForm.hiveId"
					placeholder="Hive ID(3-32 位字母数字)"
					class="hive_input" />
				<el-select v-model="hiveForm.server" placeholder="服务器" class="hive_select">
					<el-option
						v-for="item in SERVER_OPTIONS"
						:key="item.value"
						:label="item.label"
						:value="item.value" />
				</el-select>
				<el-input v-model="hiveForm.label" placeholder="备注(选填,≤20字)" class="hive_input" />
				<el-button type="primary" :loading="hiveSaving" @click="submitAddHive">新增账号</el-button>
			</div>
			<el-table :data="hiveList" border v-loading="hiveLoading" style="width: 100%">
				<el-table-column prop="hiveId" label="账号" min-width="140">
					<template #default="{ row }">{{ row.hiveId || row.hive_id || '-' }}</template>
				</el-table-column>
				<el-table-column prop="server" label="服务器" width="170">
					<template #default="{ row }">{{ getServerLabel(row.server) }}</template>
				</el-table-column>
				<el-table-column prop="label" label="备注" min-width="120">
					<template #default="{ row }">{{ row.label || '-' }}</template>
				</el-table-column>
				<el-table-column prop="createdAt" label="绑定时间" width="180">
					<template #default="{ row }">{{ formatDateTime(row.createdAt || row.created_at) }}</template>
				</el-table-column>
				<el-table-column label="操作" width="90" align="right">
					<template #default="{ row }">
						<el-popconfirm title="确认删除该绑定账号？" @confirm="handleDeleteHive(row)">
							<template #reference>
								<el-button type="danger" link>删除</el-button>
							</template>
						</el-popconfirm>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty description="还没有绑定的 Hive 账号" :image-size="80" />
				</template>
			</el-table>
		</el-card>

		<!-- 区块4 我的兑换记录 -->
		<el-card shadow="never" class="section_card">
			<template #header><span class="section_title">我的兑换记录</span></template>
			<el-table :data="redemptionList" border v-loading="redemptionLoading" style="width: 100%">
				<el-table-column prop="created_at" label="时间" width="180">
					<template #default="{ row }">{{ formatDateTime(row.created_at || row.createdAt) }}</template>
				</el-table-column>
				<el-table-column prop="server" label="服务器" width="170">
					<template #default="{ row }">{{ getServerLabel(row.server) }}</template>
				</el-table-column>
				<el-table-column label="账号" min-width="120">
					<template #default="{ row }">{{ row.hive_id || row.hiveid || '-' }}</template>
				</el-table-column>
				<el-table-column label="兑换码" min-width="160">
					<template #default="{ row }">{{ row.codes || row.code || row.coupon || '-' }}</template>
				</el-table-column>
				<el-table-column label="结果" min-width="140">
					<template #default="{ row }">
						<span :class="{ success_text: isRedeemSuccess(row) }">
							{{ row.retMsg || row.ret_msg || row.result || (isRedeemSuccess(row) ? '成功' : '-') }}
						</span>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty description="暂无兑换记录" :image-size="80" />
				</template>
			</el-table>
		</el-card>
	</div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getHiveIds, addHiveId, deleteHiveId, changePassword } from '@/services/auth';
import { getMyRedemptions } from '@/services/redemption';
import { SERVER_OPTIONS, getServerLabel } from '@/common/constant';
import { formatDateTime } from '@/utils/format';

const router = useRouter();
const userStore = useUserStore();

// ===== 区块1 基本信息 =====
const baseLoading = ref(false);
const nicknameEditing = ref(false);
const nicknameForm = ref('');
const nicknameSaving = ref(false);

const startEditNickname = () => {
	nicknameForm.value = userStore.user?.nickname || '';
	nicknameEditing.value = true;
};

const cancelEditNickname = () => {
	nicknameEditing.value = false;
	nicknameForm.value = '';
};

const submitNickname = async () => {
	const nickname = nicknameForm.value.trim();
	if (nickname.length < 1 || nickname.length > 20) {
		ElMessage.warning('昵称为 1-20 个字符');
		return;
	}
	nicknameSaving.value = true;
	try {
		await userStore.updateMe({ nickname });
		ElMessage.success('昵称已更新');
		cancelEditNickname();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	} finally {
		nicknameSaving.value = false;
	}
};

// ===== 区块2 修改密码 =====
const passwordFormRef = ref(null);
const passwordSaving = ref(false);
const passwordForm = reactive({
	oldPassword: '',
	newPassword: '',
	confirmPassword: ''
});

const passwordRules = {
	oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
	newPassword: [
		{ required: true, message: '请输入新密码', trigger: 'blur' },
		{ min: 8, message: '新密码至少 8 位', trigger: 'blur' }
	],
	confirmPassword: [
		{ required: true, message: '请再次输入新密码', trigger: 'blur' },
		{
			validator: (rule, value, callback) => {
				if (value !== passwordForm.newPassword) {
					callback(new Error('两次输入的密码不一致'));
				} else {
					callback();
				}
			},
			trigger: 'blur'
		}
	]
};

const submitPassword = () => {
	passwordFormRef.value?.validate(async (valid) => {
		if (!valid) {
			return;
		}
		passwordSaving.value = true;
		try {
			const res = await changePassword({
				oldPassword: passwordForm.oldPassword,
				newPassword: passwordForm.newPassword
			});
			// 用返回的新 token 替换本地旧 token(旧 token 已全部失效)
			if (res?.accessToken) {
				userStore.setTokens(res.accessToken, res.refreshToken);
			}
			ElMessage.success('密码修改成功，请重新登录');
			userStore.clearAuth();
			router.push('/login');
		} catch (e) {
			// 错误提示由 axios 拦截器统一处理
		} finally {
			passwordSaving.value = false;
		}
	});
};

// ===== 区块3 我的 Hive 账号 =====
const hiveList = ref([]);
const hiveLoading = ref(false);
const hiveSaving = ref(false);
const hiveForm = reactive({
	hiveId: '',
	server: 'china',
	label: ''
});

const initHiveList = async () => {
	hiveLoading.value = true;
	try {
		const res = await getHiveIds();
		hiveList.value = res?.list || [];
	} catch (e) {
		console.error('获取 Hive 账号失败', e);
	} finally {
		hiveLoading.value = false;
	}
};

const submitAddHive = async () => {
	const hiveId = hiveForm.hiveId.trim();
	const label = hiveForm.label.trim();
	if (!/^[A-Za-z0-9]{3,32}$/.test(hiveId)) {
		ElMessage.warning('Hive ID 需为 3-32 位字母数字');
		return;
	}
	if (!hiveForm.server) {
		ElMessage.warning('请选择服务器');
		return;
	}
	if (label.length > 20) {
		ElMessage.warning('备注不能超过 20 个字符');
		return;
	}
	hiveSaving.value = true;
	try {
		await addHiveId({
			hiveId,
			server: hiveForm.server,
			label: label || undefined
		});
		ElMessage.success('绑定成功');
		hiveForm.hiveId = '';
		hiveForm.label = '';
		initHiveList();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	} finally {
		hiveSaving.value = false;
	}
};

const handleDeleteHive = async (row) => {
	try {
		await deleteHiveId(row.id);
		ElMessage.success('已删除');
		initHiveList();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	}
};

// ===== 区块4 我的兑换记录 =====
const redemptionList = ref([]);
const redemptionLoading = ref(false);

const initRedemptionList = async () => {
	redemptionLoading.value = true;
	try {
		const res = await getMyRedemptions();
		redemptionList.value = res?.list || [];
	} catch (e) {
		console.error('获取兑换记录失败', e);
	} finally {
		redemptionLoading.value = false;
	}
};

const isRedeemSuccess = (row) => {
	return row.retCode == 100 || row.ret_code == 100 || row.result === 'success';
};

onMounted(async () => {
	// 拉取最新用户信息(含 hiveIds)
	baseLoading.value = true;
	try {
		await userStore.fetchMe();
	} catch (e) {
		console.error('获取用户信息失败', e);
	} finally {
		baseLoading.value = false;
	}
	initHiveList();
	initRedemptionList();
});
</script>

<style lang="less">
.profile_wrapper {
	padding: 20px;
	background-color: #ffffff;
	min-height: 100%;
	.page_title {
		font-size: 20px;
		font-weight: 600;
		margin: 12px 0 16px;
	}
	.section_card {
		margin-bottom: 16px;
		.section_title {
			font-weight: 600;
		}
	}
	.nickname_row {
		display: flex;
		align-items: center;
		gap: 8px;
		.nickname_input {
			width: 220px;
		}
	}
	.password_form {
		max-width: 460px;
	}
	.hive_add_form {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 12px;
		.hive_input {
			width: 220px;
		}
		.hive_select {
			width: 200px;
		}
	}
	.success_text {
		color: #67c23a;
	}
}
</style>
