<template>
	<div class="login_wrapper">
		<el-card class="login_card">
			<div class="login_title">魔灵召唤 - 账号登录</div>
			<el-tabs v-model="activeTab" class="login_tabs" stretch>
				<el-tab-pane label="登录" name="login">
					<el-form
						ref="loginFormRef"
						:model="loginForm"
						:rules="rules"
						label-position="top"
						@keyup.enter="submitLogin">
						<el-form-item label="用户名" prop="username">
							<el-input v-model="loginForm.username" placeholder="请输入用户名" />
						</el-form-item>
						<el-form-item label="密码" prop="password">
							<el-input
								v-model="loginForm.password"
								type="password"
								show-password
								placeholder="请输入密码" />
						</el-form-item>
						<el-button
							type="primary"
							class="login_btn"
							:loading="submitting"
							@click="submitLogin">
							登 录
						</el-button>
					</el-form>
				</el-tab-pane>
				<el-tab-pane label="注册" name="register">
					<el-form
						ref="registerFormRef"
						:model="registerForm"
						:rules="registerRules"
						label-position="top"
						@keyup.enter="submitRegister">
						<el-form-item label="用户名" prop="username">
							<el-input v-model="registerForm.username" placeholder="请输入用户名" />
						</el-form-item>
						<el-form-item label="昵称(选填)" prop="nickname">
							<el-input v-model="registerForm.nickname" placeholder="请输入昵称" />
						</el-form-item>
						<el-form-item label="密码" prop="password">
							<el-input
								v-model="registerForm.password"
								type="password"
								show-password
								placeholder="请输入密码" />
						</el-form-item>
						<el-form-item label="确认密码" prop="confirmPassword">
							<el-input
								v-model="registerForm.confirmPassword"
								type="password"
								show-password
								placeholder="请再次输入密码" />
						</el-form-item>
						<el-button
							type="primary"
							class="login_btn"
							:loading="submitting"
							@click="submitRegister">
							注 册
						</el-button>
					</el-form>
				</el-tab-pane>
			</el-tabs>
			<div class="login_tip">游客可直接浏览与留言，登录后可使用兑换与查看个人记录</div>
			<div class="login_back">
				<el-button link type="primary" @click="goBack">返回首页</el-button>
			</div>
		</el-card>
	</div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import * as authService from '@/services/auth';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('login');
const submitting = ref(false);
const loginFormRef = ref(null);
const registerFormRef = ref(null);

const loginForm = reactive({
	username: '',
	password: ''
});

const registerForm = reactive({
	username: '',
	nickname: '',
	password: '',
	confirmPassword: ''
});

const rules = {
	username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
	password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

const registerRules = {
	username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
	password: [
		{ required: true, message: '请输入密码', trigger: 'blur' },
		{ min: 6, message: '密码至少 6 位', trigger: 'blur' }
	],
	confirmPassword: [
		{ required: true, message: '请再次输入密码', trigger: 'blur' },
		{
			validator: (rule, value, callback) => {
				if (value !== registerForm.password) {
					callback(new Error('两次输入的密码不一致'));
				} else {
					callback();
				}
			},
			trigger: 'blur'
		}
	]
};

const redirectAfterLogin = () => {
	let redirect = route.query.redirect;
	// 兼容旧 /game/* 重定向参数(路由层有 /game/xxx -> /xxx 兜底转换)
	if (typeof redirect === 'string' && redirect.startsWith('/')) {
		router.push(redirect);
	} else {
		router.push('/home');
	}
};

const submitLogin = () => {
	loginFormRef.value?.validate(async (valid) => {
		if (!valid) {
			return;
		}
		submitting.value = true;
		try {
			await userStore.login({
				username: loginForm.username.trim(),
				password: loginForm.password
			});
			ElMessage.success(userStore.isAdmin ? '欢迎回来，管理员' : '登录成功');
			redirectAfterLogin();
		} catch (e) {
			// 错误提示由 axios 拦截器统一处理
		} finally {
			submitting.value = false;
		}
	});
};

const submitRegister = () => {
	registerFormRef.value?.validate(async (valid) => {
		if (!valid) {
			return;
		}
		submitting.value = true;
		try {
			await authService.register({
				username: registerForm.username.trim(),
				password: registerForm.password,
				nickname: registerForm.nickname.trim() || undefined
			});
			ElMessage.success('注册成功，自动登录中...');
			// 注册成功后自动登录
			await userStore.login({
				username: registerForm.username.trim(),
				password: registerForm.password
			});
			redirectAfterLogin();
		} catch (e) {
			// 错误提示由 axios 拦截器统一处理
		} finally {
			submitting.value = false;
		}
	});
};

const goBack = () => {
	router.push('/home');
};
</script>

<style scoped lang="less">
.login_wrapper {
	width: 100%;
	height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #e0f2ff 0%, #f7f8fa 100%);
	.login_card {
		width: 420px;
		:deep(.el-card__body) {
			padding: 24px 32px;
		}
	}
	.login_title {
		font-size: 20px;
		font-weight: 600;
		text-align: center;
		margin-bottom: 12px;
		color: #303133;
	}
	.login_tabs {
		.login_btn {
			width: 100%;
			margin-top: 4px;
		}
	}
	.login_tip {
		margin-top: 12px;
		font-size: 12px;
		color: #909399;
		text-align: center;
	}
	.login_back {
		margin-top: 8px;
		text-align: center;
	}
}
</style>
