<template>
	<div class="profile_wrapper">
		<div class="page_title">{{ t('common.profile') }}</div>

		<!-- 区块1 基本信息 -->
		<el-card shadow="never" class="section_card" v-loading="baseLoading">
			<template #header><span class="section_title">{{ t('profile.basic') }}</span></template>
			<el-descriptions :column="isMobile ? 1 : 2" border>
				<el-descriptions-item :label="t('common.username')">
					{{ userStore.user?.username || '-' }}
				</el-descriptions-item>
				<el-descriptions-item :label="t('common.role')">
					<el-tag :type="userStore.isAdmin ? 'danger' : 'info'">
						{{ userStore.isAdmin ? t('common.adminRole') : t('common.userRole') }}
					</el-tag>
				</el-descriptions-item>
				<el-descriptions-item :label="t('profile.registerAt')">
					{{ formatDateTime(userStore.user?.createdAt || userStore.user?.created_at) }}
				</el-descriptions-item>
				<el-descriptions-item :label="t('common.nickname')">
					<div class="nickname_row">
						<template v-if="!nicknameEditing">
							<span>{{ userStore.displayName || '-' }}</span>
							<el-button type="primary" link @click="startEditNickname">{{ t('common.edit') }}</el-button>
						</template>
						<template v-else>
							<el-input
								v-model="nicknameForm"
								maxlength="20"
								:placeholder="t('profile.nicknameLen')"
								class="nickname_input"
								@keyup.enter="submitNickname" />
							<el-button type="primary" :loading="nicknameSaving" @click="submitNickname">
														{{ t('common.save') }}
							</el-button>
							<el-button @click="cancelEditNickname">{{ t('common.cancel') }}</el-button>
						</template>
					</div>
				</el-descriptions-item>
			</el-descriptions>
		</el-card>

		<!-- 区块2 修改密码 -->
		<el-card shadow="never" class="section_card">
			<template #header><span class="section_title">{{ t('profile.changePassword') }}</span></template>
			<el-form
				ref="passwordFormRef"
				:model="passwordForm"
				:rules="passwordRules"
				label-width="100px"
				class="password_form">
				<el-form-item :label="t('login.oldPassword')" prop="oldPassword">
					<el-input
						v-model="passwordForm.oldPassword"
						type="password"
						show-password
						:placeholder="t('login.inputOldPassword')" />
				</el-form-item>
				<el-form-item :label="t('login.newPassword')" prop="newPassword">
					<el-input
						v-model="passwordForm.newPassword"
						type="password"
						show-password
						:placeholder="t('login.newPasswordMin')" />
				</el-form-item>
				<el-form-item :label="t('login.confirmNewPassword')" prop="confirmPassword">
					<el-input
						v-model="passwordForm.confirmPassword"
						type="password"
						show-password
						:placeholder="t('login.reinputPassword')" />
				</el-form-item>
				<el-form-item>
					<el-button type="primary" :loading="passwordSaving" @click="submitPassword">
										{{ t('profile.changePassword') }}
					</el-button>
				</el-form-item>
			</el-form>
		</el-card>

		<!-- 区块3 我的 Hive 账号 -->
		<el-card shadow="never" class="section_card">
			<template #header><span class="section_title">{{ t('hive.mine') }}</span></template>
			<div class="hive_add_form">
				<el-input
					v-model="hiveForm.hiveId"
					:placeholder="t('coupon.hivePlaceholder')"
					class="hive_input" />
				<el-select v-model="hiveForm.server" :placeholder="t('common.server')" class="hive_select">
					<el-option
						v-for="item in SERVER_OPTIONS"
						:key="item.value"
						:label="item.label"
						:value="item.value" />
				</el-select>
				<el-input v-model="hiveForm.label" :placeholder="t('coupon.noteOptional')" class="hive_input" />
				<el-button type="primary" :loading="hiveSaving" @click="submitAddHive">{{ t('hive.add') }}</el-button>
			</div>
			<el-table :data="hiveList" border v-loading="hiveLoading" style="width: 100%">
				<el-table-column prop="hiveId" :label="t('common.account')" min-width="140">
					<template #default="{ row }">{{ row.hiveId || row.hive_id || '-' }}</template>
				</el-table-column>
				<el-table-column prop="wizardName" :label="t('coupon.summoner')" min-width="110">
					<template #default="{ row }">{{ row.wizardName || '-' }}</template>
				</el-table-column>
				<el-table-column prop="server" :label="t('common.server')" width="170">
					<template #default="{ row }">{{ getServerLabel(row.server) }}</template>
				</el-table-column>
				<el-table-column prop="label" :label="t('common.note')" min-width="120">
					<template #default="{ row }">{{ row.label || '-' }}</template>
				</el-table-column>
				<el-table-column prop="createdAt" :label="t('hive.bindTime')" width="180">
					<template #default="{ row }">{{ formatDateTime(row.createdAt || row.created_at) }}</template>
				</el-table-column>
				<!-- 自动兑换开关:仅白名单用户与管理员可见(接口返回 allowed=true) -->
				<el-table-column v-if="autoRedeem.allowed" :label="t('autoRedeem.col')" width="100" align="center">
					<template #default="{ row }">
						<el-switch
							:model-value="autoRedeemMap[row.id] === 1"
							:disabled="!!arSwitching[row.id]"
							@change="(val) => toggleAutoRedeem(row, val)" />
					</template>
				</el-table-column>
				<el-table-column :label="t('common.action')" width="90" align="right">
					<template #default="{ row }">
						<el-popconfirm :title="t('hive.confirmDelete')" @confirm="handleDeleteHive(row)">
							<template #reference>
								<el-button type="danger" link>{{ t('common.delete') }}</el-button>
							</template>
						</el-popconfirm>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty :description="t('hive.empty')" :image-size="80" />
				</template>
			</el-table>
		</el-card>

		<!-- 区块3.4 兑换码使用情况(自动兑换;行 = 我的账号,列 = 最近 20 个兑换码;仅白名单用户与管理员可见) -->
		<el-card shadow="never" class="section_card" v-if="autoRedeem.allowed">
			<template #header><span class="section_title">{{ t('autoRedeem.title') }}</span></template>
			<el-alert
				v-if="!autoRedeem.enabled"
				:title="t('autoRedeem.paused')"
				type="info"
				show-icon
				:closable="false"
				class="ar_alert" />
			<div class="ar_tip">{{ t('autoRedeem.tip') }}</div>
			<el-table :data="autoRedeem.rows" border v-loading="arLoading" size="small" v-if="autoRedeem.codes.length > 0">
				<el-table-column :label="t('common.account')" min-width="180" fixed>
					<template #default="{ row }">{{ row.name }}</template>
				</el-table-column>
				<el-table-column v-for="code in autoRedeem.codes" :key="code.code" min-width="118" align="center">
					<template #header>
						<el-tooltip v-if="code.content" :content="code.content" placement="top">
							<div class="ar_code">{{ (code.code || '').toUpperCase() }}</div>
						</el-tooltip>
						<div v-else class="ar_code">{{ (code.code || '').toUpperCase() }}</div>
						<div class="ar_code_meta">
							<el-tag v-if="code.status !== 'verified'" size="small" type="info">{{ t('autoRedeem.expired') }}</el-tag>
						</div>
					</template>
					<template #default="{ row }">
						<el-tooltip v-if="row.cells[code.code]" :content="cellTooltip(row.cells[code.code])" placement="top">
							<span :class="['ar_cell', 'ar_' + cellKind(row.cells[code.code])]">{{ cellText(row.cells[code.code]) }}</span>
						</el-tooltip>
						<span v-else class="ar_none">-</span>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty :description="t('hive.empty')" :image-size="60" />
				</template>
			</el-table>
			<el-empty v-else :description="t('autoRedeem.empty')" :image-size="60" />
		</el-card>

		<!-- 区块3.5 我的收藏(3v3 防守/克制) -->
		<el-card shadow="never" class="section_card">
			<template #header><span class="section_title">{{ t('pvp.myFavorites') }}</span></template>
			<el-table :data="favRows" border v-loading="favLoading" style="width: 100%">
				<el-table-column :label="t('pvp.favTarget')" width="90">
					<template #default="{ row }">{{ row.target_type === 'defense' ? t('pvp.defenseTitle') : t('pvp.counterCol') }}</template>
				</el-table-column>
				<el-table-column :label="t('pvp.favContent')" min-width="200">
					<template #default="{ row }">
						<span v-if="row.label">{{ row.label }}</span>
						<span v-else class="fav_raw">#{{ row.target_id }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="created_at" :label="t('common.time')" width="160">
					<template #default="{ row }">{{ (row.created_at || '').slice(0, 16).replace('T', ' ') }}</template>
				</el-table-column>
				<el-table-column :label="t('common.action')" width="120" align="right">
					<template #default="{ row }">
						<el-button v-if="row.key" type="primary" link @click="router.push(`/3v3/${row.key}`)">{{ t('pvp.viewDefense') }}</el-button>
						<el-popconfirm :title="t('pvp.favOffConfirm')" @confirm="removeFav(row)">
							<template #reference>
								<el-button type="danger" link>{{ t('common.delete') }}</el-button>
							</template>
						</el-popconfirm>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty :description="t('pvp.favEmpty')" :image-size="80" />
				</template>
			</el-table>
		</el-card>

		<!-- 区块4 我的兑换记录 -->
		<el-card shadow="never" class="section_card">
			<template #header><span class="section_title">{{ t('redemption.mine') }}</span></template>
			<el-table :data="redemptionList" border v-loading="redemptionLoading" style="width: 100%">
				<el-table-column prop="created_at" :label="t('common.time')" width="180">
					<template #default="{ row }">{{ formatDateTime(row.created_at || row.createdAt) }}</template>
				</el-table-column>
				<el-table-column prop="server" :label="t('common.server')" width="170">
					<template #default="{ row }">{{ getServerLabel(row.server) }}</template>
				</el-table-column>
				<el-table-column :label="t('common.account')" min-width="120">
					<template #default="{ row }">{{ row.hive_id || row.hiveid || '-' }}</template>
				</el-table-column>
				<el-table-column :label="t('coupon.codes')" min-width="160">
					<template #default="{ row }">{{ row.codes || row.code || row.coupon || '-' }}</template>
				</el-table-column>
				<el-table-column :label="t('common.result')" min-width="140">
					<template #default="{ row }">
						<span :class="{ success_text: isRedeemSuccess(row) }">
							{{ row.retMsg || row.ret_msg || row.result || (isRedeemSuccess(row) ? t('coupon.success') : '-') }}
						</span>
					</template>
				</el-table-column>
				<template #empty>
					<el-empty :description="t('redemption.empty')" :image-size="80" />
				</template>
			</el-table>
		</el-card>
	</div>
</template>

<script setup>
import { t } from '@/common/i18n';
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';
import { getHiveIds, addHiveId, deleteHiveId, changePassword } from '@/services/auth';
import { getMyRedemptions } from '@/services/redemption';
import { getMyAutoRedeem, setAutoRedeem } from '@/services/autoRedeem';
import { getFavorites, toggleFavorite } from '@/services/interact3mdc';
import { fetchDefense, fetch3mdcManifest } from '@/services/3mdc';
import { fetchMonsterList } from '@/services/monster';
import { SERVER_OPTIONS, getServerLabel } from '@/common/constant';
import { formatDateTime } from '@/utils/format';

const router = useRouter();
const userStore = useUserStore();

// 手机 web:基本信息描述列表改单列
const isMobile = ref(false);
let mobileMediaQuery = null;
const handleMobileMediaChange = (event) => {
	isMobile.value = event.matches;
};

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
		ElMessage.warning(t('profile.nicknameRule'));
		return;
	}
	nicknameSaving.value = true;
	try {
		await userStore.updateMe({ nickname });
		ElMessage.success(t('profile.nicknameOk'));
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
			ElMessage.success(t('profile.passwordOk'));
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
		ElMessage.warning(t('coupon.hiveRule'));
		return;
	}
	if (!hiveForm.server) {
		ElMessage.warning('请选择服务器');
		return;
	}
	if (label.length > 20) {
		ElMessage.warning(t('coupon.noteMax'));
		return;
	}
	hiveSaving.value = true;
	try {
		await addHiveId({
			hiveId,
			server: hiveForm.server,
			label: label || undefined
		});
		ElMessage.success(t('hive.bindOk'));
		hiveForm.hiveId = '';
		hiveForm.label = '';
		initHiveList();
		// 新账号要立刻出现在开关列与状态矩阵里
		initAutoRedeem();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	} finally {
		hiveSaving.value = false;
	}
};

const handleDeleteHive = async (row) => {
	try {
		await deleteHiveId(row.id);
		ElMessage.success(t('hive.deleted'));
		initHiveList();
		// 被删账号要从开关列与状态矩阵里移除
		initAutoRedeem();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	}
};

// ===== 区块3.4 兑换码使用情况(自动兑换) =====
// 仅白名单用户与管理员拿到 allowed=true;其余用户接口返回 {allowed:false},开关列与本卡片都不显示
const INVALID_MAX_ATTEMPTS = 3; // 码无效的总尝试上限,与后端 lib/auto-redeem.ts 的 MAX_ATTEMPTS.invalid 一致
const emptyAutoRedeem = () => ({ allowed: false, enabled: false, codes: [], rows: [] });
const autoRedeem = ref(emptyAutoRedeem());
const autoRedeemMap = ref({}); // 绑定 id -> 是否开启自动兑换(1/0)
const arLoading = ref(false);
const arSwitching = ref({});

const initAutoRedeem = async () => {
	arLoading.value = true;
	try {
		const res = await getMyAutoRedeem();
		if (!res?.allowed) {
			autoRedeem.value = emptyAutoRedeem();
			return;
		}
		const cells = res.cells || {};
		const map = {};
		autoRedeem.value = {
			allowed: true,
			enabled: !!res.enabled,
			codes: res.codes || [],
			// 单元格 key 为 `绑定id|code`,这里按行拆开
			rows: (res.accounts || []).map((item) => {
				map[item.id] = item.autoRedeem;
				const prefix = `${item.id}|`;
				const rowCells = {};
				Object.keys(cells).forEach((key) => {
					if (key.startsWith(prefix)) {
						rowCells[key.slice(prefix.length)] = cells[key];
					}
				});
				const name = item.wizardName ? `${item.wizardName}(${item.hiveId})` : item.hiveId;
				return { id: item.id, name: `${name}（${getServerLabel(item.server)}）`, cells: rowCells };
			})
		};
		autoRedeemMap.value = map;
	} catch (e) {
		// 接口不可用(如后端尚未部署)时静默,不展示自动兑换相关区块
		autoRedeem.value = emptyAutoRedeem();
	} finally {
		arLoading.value = false;
	}
};

const toggleAutoRedeem = async (row, val) => {
	arSwitching.value = { ...arSwitching.value, [row.id]: true };
	try {
		await setAutoRedeem(row.id, !!val);
		ElMessage.success(val ? t('autoRedeem.onOk') : t('autoRedeem.offOk'));
		await initAutoRedeem();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	} finally {
		arSwitching.value = { ...arSwitching.value, [row.id]: false };
	}
};

// 账本单元格 -> 展示类别
const cellKind = (cell) => {
	if (cell.status === 'success') return cell.origin === 'auto' ? 'success_auto' : 'success';
	if (cell.status === 'invalid') return cell.attempts >= INVALID_MAX_ATTEMPTS ? 'invalid' : 'retry';
	if (cell.status === 'used' || cell.status === 'acct_invalid') return cell.status;
	return 'retry'; // pending / transient:之后还会重试
};

const cellText = (cell) => {
	const kind = cellKind(cell);
	if (kind === 'retry') {
		if (cell.status === 'invalid') return t('autoRedeem.stInvalidRetry');
		return cell.status === 'pending' ? t('autoRedeem.stPending') : t('autoRedeem.stTransient');
	}
	return {
		success_auto: t('autoRedeem.stSuccessAuto'),
		success: t('autoRedeem.stSuccess'),
		used: t('autoRedeem.stUsed'),
		invalid: t('autoRedeem.stInvalid'),
		acct_invalid: t('autoRedeem.stAcctInvalid')
	}[kind];
};

const cellTooltip = (cell) => {
	const parts = [];
	const kind = cellKind(cell);
	if (kind === 'retry' || kind === 'invalid') parts.push(t('autoRedeem.attempts', cell.attempts || 0));
	const msg = String(cell.ret_msg || '').replace(/<br\s*\/?>/gi, ' ').trim();
	if (msg && msg !== 'code_cooldown') parts.push(msg);
	if (cell.status === 'acct_invalid') parts.push(t('autoRedeem.acctInvalidTip'));
	return parts.join('；');
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

// ---- 我的收藏(3v3) ----
const favRows = ref([]);
const favLoading = ref(false);
async function loadFavorites() {
	if (!useUserStore().isLogged) return;
	favLoading.value = true;
	try {
		const r = await getFavorites();
		// idmap: defense_id -> key(约300KB,一次性);克制的 key 需在其所属防守内反查,展示降级为编号
		let idmap = {};
		try {
			const API = import.meta.env.VITE_API_BASE || 'https://api.linow.us.kg';
			const res = await fetch(`${API.replace(/\/+$/, '')}/sw/data/3mdc/idmap.json`);
			if (res.ok) idmap = await res.json();
		} catch { /* idmap 缺失时降级 */ }
		const rows = [];
		for (const f of r.list ?? []) {
			if (f.target_type === 'defense') {
				const key = idmap[f.target_id] ?? '';
				rows.push({ ...f, key, label: key || `#${f.target_id}` });
			} else {
				rows.push({ ...f, key: '', label: t('pvp.counterId', f.target_id) });
			}
		}
		favRows.value = rows;
	} catch {
		favRows.value = [];
	} finally {
		favLoading.value = false;
	}
}
async function removeFav(row) {
	try {
		await toggleFavorite(row.target_type, row.target_id);
		favRows.value = favRows.value.filter((x) => !(x.target_type === row.target_type && x.target_id === row.target_id));
		ElMessage.success(t('pvp.favOff'));
	} catch (e) {
		ElMessage.error(e.message);
	}
}

onMounted(async () => {
	if (typeof window.matchMedia === 'function') {
		mobileMediaQuery = window.matchMedia('(max-width: 768px)');
		isMobile.value = mobileMediaQuery.matches;
		mobileMediaQuery.addEventListener('change', handleMobileMediaChange);
	}
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
	initAutoRedeem();
	initRedemptionList();
	loadFavorites();
});

onBeforeUnmount(() => {
	mobileMediaQuery?.removeEventListener('change', handleMobileMediaChange);
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
	// 兑换码使用情况矩阵
	.ar_alert {
		margin-bottom: 10px;
	}
	.ar_tip {
		font-size: 12px;
		color: #909399;
		margin-bottom: 10px;
	}
	.ar_code {
		font-weight: 600;
		letter-spacing: 0.3px;
	}
	.ar_code_meta {
		height: 20px;
		margin-top: 2px;
	}
	.ar_cell {
		font-size: 12px;
		white-space: nowrap;
		&.ar_success,
		&.ar_success_auto {
			color: #67c23a;
		}
		&.ar_used {
			color: #67c23a;
			opacity: 0.7;
		}
		&.ar_retry {
			color: #e6a23c;
		}
		&.ar_invalid,
		&.ar_acct_invalid {
			color: #f56c6c;
		}
	}
	.ar_none {
		color: #c0c4cc;
	}
	// 手机 web:内边距压缩,表单项占满全宽(表格由 el-table 自带横向滚动)
	@media (max-width: 768px) {
		padding: 12px;
		.page_title {
			margin: 4px 0 12px;
		}
		.nickname_row {
			flex-wrap: wrap;
			.nickname_input {
				width: 140px;
			}
		}
		.password_form {
			max-width: 100%;
		}
		.hive_add_form {
			.hive_input {
				flex: 1 1 calc(50% - 8px);
				width: auto;
				min-width: 0;
			}
			.hive_select {
				width: auto;
				flex: 1 1 calc(50% - 8px);
				min-width: 0;
			}
		}
	}
}
</style>
