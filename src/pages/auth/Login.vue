<template>
	<div class="login_wrapper">
		<el-card class="login_card">
			<div class="login_title">{{ t('login.title') }}</div>
			<el-tabs v-model="activeTab" class="login_tabs" stretch>
				<el-tab-pane :label="t('login.tabLogin')" name="login">
					<el-form
						ref="loginFormRef"
						:model="loginForm"
						:rules="rules"
						label-position="top"
						@keyup.enter="submitLogin">
						<el-form-item :label="t('common.username')" prop="username">
							<el-input v-model="loginForm.username" :placeholder="t('login.inputUsername')" />
						</el-form-item>
						<el-form-item :label="t('login.password')" prop="password">
							<el-input
								v-model="loginForm.password"
								type="password"
								show-password
								:placeholder="t('login.inputPassword')" />
						</el-form-item>
						<el-button
							type="primary"
							class="login_btn"
							:loading="submitting"
							@click="submitLogin">
							{{ t('login.btnLogin') }}
						</el-button>
					</el-form>
				</el-tab-pane>
				<el-tab-pane :label="t('login.tabRegister')" name="register">
					<el-form
						ref="registerFormRef"
						:model="registerForm"
						:rules="registerRules"
						label-position="top"
						@keyup.enter="submitRegister">
						<el-form-item :label="t('common.username')" prop="username">
							<el-input v-model="registerForm.username" :placeholder="t('login.inputUsername')" />
						</el-form-item>
						<el-form-item :label="t('login.nicknameOptional')" prop="nickname">
							<el-input v-model="registerForm.nickname" :placeholder="t('login.inputNickname')" />
						</el-form-item>
						<el-form-item :label="t('login.inputPasswordLabel')" prop="password">
							<el-input
								v-model="registerForm.password"
								type="password"
								show-password
								:placeholder="t('login.inputPassword')" />
						</el-form-item>
						<el-form-item :label="t('login.confirmPassword')" prop="confirmPassword">
							<el-input
								v-model="registerForm.confirmPassword"
								type="password"
								show-password
								:placeholder="t('login.reinputPassword')" />
						</el-form-item>
						<el-button
							type="primary"
							class="login_btn"
							:loading="submitting"
							@click="submitRegister">
							{{ t('login.btnRegister') }}
						</el-button>
					</el-form>
				</el-tab-pane>
			</el-tabs>
			<div class="login_tip">{{ t('login.tip') }}</div>
			<div class="login_back">
				<el-button link type="primary" @click="goBack">{{ t('common.backHome') }}</el-button>
			</div>
		</el-card>
	</div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { t } from '@/common/i18n';
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
	username: [{ required: true, message: t('login.inputUsername'), trigger: 'blur' }],
	password: [{ required: true, message: t('login.inputPassword'), trigger: 'blur' }]
};

const registerRules = {
	username: [{ required: true, message: t('login.inputUsername'), trigger: 'blur' }],
	password: [
		{ required: true, message: t('login.inputPassword'), trigger: 'blur' },
		{ min: 6, message: t('login.passwordMin'), trigger: 'blur' }
	],
	confirmPassword: [
		{ required: true, message: t('login.reinputPassword'), trigger: 'blur' },
		{
			validator: (rule, value, callback) => {
				if (value !== registerForm.password) {
					callback(new Error(t('login.passwordMismatch')));
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
	background: #f0f5fb;
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
	// 手机 web:卡片占满宽度,容器可纵向滚动(注册表单较高时不被裁掉)
	@media (max-width: 768px) {
		overflow-y: auto;
		padding: 16px;
		.login_card {
			width: 100%;
			max-width: 420px;
			margin: auto;
			:deep(.el-card__body) {
				padding: 16px;
			}
		}
	}
}
</style>
