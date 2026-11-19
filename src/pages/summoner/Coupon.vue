<template>
	<div class="coupon_wrapper" v-loading.fullscreen.lock="fullscreenLoading">
		<div class="page_header">
			<div class="page_title">兑换码直兑</div>
			<div class="update_time" v-if="updateTime">更新于 {{ formatDateTime(updateTime) }}</div>
		</div>

		<div class="login_tip" v-if="!userStore.isLogged">
			<el-alert
				title="游客可直接兑换单个账号；登录后支持批量 6 个账号，并保存兑换记录"
				type="info"
				show-icon
				:closable="false" />
		</div>

		<!-- 卡片:兑换码列表 -->
		<div class="coupon_card">
			<div class="card_header">
				<span class="card_title">最新兑换码</span>
				<div class="card_actions">
					<el-button size="small" :loading="onLoading" @click="initCodeList()">刷新</el-button>
					<el-button size="small" type="primary" plain @click="setCodeList()">一键填入兑换码</el-button>
				</div>
			</div>
			<el-table :data="codeList" style="width: 100%" v-loading="onLoading" size="default">
				<el-table-column prop="code" label="兑换码" width="200">
					<template #default="scope">
						<a class="code_link" :href="getcouponUrl(scope.row)" target="_blank" rel="noopener">
							{{ (scope.row.code || '').toUpperCase() }}
						</a>
					</template>
				</el-table-column>
				<el-table-column prop="content" label="奖励内容" min-width="240" show-overflow-tooltip />
				<el-table-column prop="created_at" label="上架日期" width="110" />
				<el-table-column label="最后有效兑换" width="160">
					<template #default="{ row }">
						<span v-if="row.last_success_at" class="success_text">{{ formatDateTime(row.last_success_at) }}</span>
						<span v-else class="muted_text">-</span>
					</template>
				</el-table-column>
			</el-table>
		</div>

		<!-- 卡片:兑换操作 -->
		<div class="coupon_card">
			<div class="card_header">
				<span class="card_title">兑换操作</span>
			</div>
			<div class="bound_box" v-if="userStore.isLogged && boundList.length > 0">
				<div class="bound_header">
					<label class="bound_label">使用已绑定账号</label>
					<el-checkbox
						class="bound_all"
						:model-value="isAllBoundSelected"
						:indeterminate="isBoundIndeterminate"
						@change="handleToggleAllBound">
						全选
					</el-checkbox>
				</div>
				<el-checkbox-group v-model="selectedBound" :max="6" @change="handleBoundChange">
					<el-checkbox v-for="item in boundList" :key="item.id" :value="item.hiveId">
						{{ item.wizardName ? item.wizardName + '(' + item.hiveId + ')' : item.hiveId }}
						<span class="bound_server">（{{ getServerLabel(item.server) }}）</span>
						<span v-if="item.label" class="bound_remark">{{ item.label }}</span>
					</el-checkbox>
				</el-checkbox-group>
				<div class="bound_tip">勾选后自动填入 Hive ID（最多 6 个）；也可直接手动输入，二者取其一</div>
			</div>
			<div class="form_grid">
				<div class="input_item">
					<label for="server">服务器</label>
					<el-select v-model="serverValue" placeholder="请选择">
						<el-option
							v-for="item in serverOption"
							:key="item.value"
							:label="item.label"
							:value="item.value"></el-option>
					</el-select>
				</div>
				<div class="input_item">
					<label for="hiveid">Hive ID（多个用分号分隔，游客 1 个 / 登录最多 6 个）</label>
					<el-input type="text" id="hiveid" v-model="hiveIds" placeholder="如 408601 或 408601;295135" @input="handleManualInput"></el-input>
				</div>
			</div>
			<div class="input_item full">
				<label for="coupon">兑换码（多个用分号分隔）</label>
				<el-input type="text" id="coupon" v-model="coupons" placeholder="可点上方一键填入，或手动输入"></el-input>
			</div>
			<div class="submit_bar">
				<el-button type="primary" size="large" @click="beforeSendRequest()">提交兑换</el-button>
			</div>
		</div>

		<!-- 卡片:兑换结果 -->
		<div class="coupon_card" v-if="resultList.length > 0">
			<div class="card_header">
				<span class="card_title">兑换结果</span>
			</div>
			<div class="result_item" v-for="(item, index) in resultList" :key="index" :class="{ success: item.retCode == 100 }">
				<span class="r_code">{{ item.coupon }}</span>
				<span class="r_account">{{ item.hiveid }}</span>
				<span class="r_msg">{{ item.retMsg || item.error || (item.retCode == 100 ? '成功' : '失败') }}</span>
			</div>
		</div>

		<!-- 卡片:我的兑换记录 -->
		<div class="coupon_card" v-if="userStore.isLogged">
			<div class="card_header">
				<span class="card_title">我的兑换记录</span>
			</div>
			<el-table :data="mineList" v-loading="mineLoading" size="small">
				<el-table-column label="时间" width="170">
					<template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
				</el-table-column>
				<el-table-column label="服务器" width="110">
					<template #default="{ row }">{{ getServerLabel(row.server) || '-' }}</template>
				</el-table-column>
				<el-table-column label="Hive ID">
					<template #default="{ row }">{{ row.hive_id || row.hiveid || '-' }}</template>
				</el-table-column>
				<el-table-column label="兑换码">
					<template #default="{ row }">{{ row.codes || row.coupon || '-' }}</template>
				</el-table-column>
				<el-table-column label="结果" min-width="160" show-overflow-tooltip>
					<template #default="{ row }">
						<span :class="{ success_text: row.retCode == 100 }">{{ row.retMsg || row.ret_msg || row.result || '-' }}</span>
					</template>
				</el-table-column>
			</el-table>
		</div>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCoupons } from '@/services/coupon';
import { checkRedemption, redeemCoupons, getMyRedemptions } from '@/services/redemption';
import { getHiveIds } from '@/services/auth';
import { useUserStore } from '@/stores/user';
import { SERVER_OPTIONS, getServerLabel } from '@/common/constant';
import { formatDateTime } from '@/utils/format';

const userStore = useUserStore();

const hiveIds = ref('');
const coupons = ref('');
const codeList = ref([]);
const resultList = ref([]);
const mineList = ref([]);
const onLoading = ref(false);
const fullscreenLoading = ref(false);
const mineLoading = ref(false);
const updateTime = ref('');
const serverOption = ref(SERVER_OPTIONS);
const serverValue = ref('china');

// ===== 已绑定 Hive 账号快捷选择 =====
const boundList = ref([]);
const selectedBound = ref([]);

onMounted(() => {
	initCodeList();
	if (userStore.isLogged) {
		initMineList();
		initBoundList();
	}
});

// 拉取个人绑定的 Hive 账号(实时,不依赖登录缓存)
let initBoundList = async () => {
	try {
		const res = await getHiveIds();
		boundList.value = res?.list || [];
	} catch (err) {
		console.error('获取绑定账号失败:', err);
	}
};

// 勾选绑定账号:自动填入 Hive ID 输入框;所选账号服务器一致时自动切换服务器
let handleBoundChange = (selected) => {
	if (!selected || selected.length === 0) {
		return;
	}
	hiveIds.value = selected.join(';');
	const servers = boundList.value
		.filter((item) => selected.includes(item.hiveId))
		.map((item) => item.server);
	const uniqueServers = [...new Set(servers)];
	if (uniqueServers.length === 1 && uniqueServers[0]) {
		serverValue.value = uniqueServers[0];
	}
};

// 手动输入:清空绑定账号勾选(二选一)
let handleManualInput = () => {
	selectedBound.value = [];
};

// ===== 绑定账号"全选"联动(受 max 6 限制) =====
const BOUND_SELECT_LIMIT = 6;

// 可全选的上限:超过 6 个只能取前 6
const isAllBoundSelected = computed(() => {
	if (boundList.value.length === 0) {
		return false;
	}
	const limit = Math.min(BOUND_SELECT_LIMIT, boundList.value.length);
	return selectedBound.value.length >= limit;
});

const isBoundIndeterminate = computed(() => {
	return selectedBound.value.length > 0 && !isAllBoundSelected.value;
});

let handleToggleAllBound = (checked) => {
	if (!checked) {
		// 取消全选:清空勾选并同步清空自动填入的 Hive ID
		selectedBound.value = [];
		hiveIds.value = '';
		return;
	}
	const allIds = boundList.value.slice(0, BOUND_SELECT_LIMIT).map((item) => item.hiveId);
	if (boundList.value.length > BOUND_SELECT_LIMIT) {
		ElMessage.warning(`一次最多支持 ${BOUND_SELECT_LIMIT} 个账号，已选择前 ${BOUND_SELECT_LIMIT} 个`);
	}
	selectedBound.value = allIds;
	handleBoundChange(allIds);
};

// 获取最新兑换码信息
let initCodeList = async () => {
	onLoading.value = true;
	try {
		const res = await getCoupons();
		codeList.value = res?.list || [];
		updateTime.value = res?.updateTime || '';
	} catch (err) {
		console.error('获取数据时出错:', err);
	} finally {
		onLoading.value = false;
	}
};

let getcouponUrl = (row) => {
	if (row.url) {
		return row.url;
	}
	return `https://withhive.me/313/${row.code}`;
};

// 一键填入:取列表 code 分号连接
let setCodeList = () => {
	let codesStr = codeList.value
		.map((e) => {
			return e.code;
		})
		.filter((e) => !!e)
		.join(';');
	coupons.value = codesStr || '';
	if (!codesStr) {
		ElMessage.warning('暂无可用兑换码');
	}
};

const parseList = (text) => {
	return (text || '')
		.split(';')
		.map((e) => e.trim())
		.filter((e) => !!e);
};

let beforeSendRequest = () => {
	let hiveidsList = parseList(hiveIds.value);
	if (hiveidsList.length === 0) {
		ElMessage.error('请输入账号！');
		return;
	}
	// 游客限单账号,登录用户限 6 个
	if (!userStore.isLogged && hiveidsList.length > 1) {
		ElMessage.error('游客每次仅可兑换 1 个账号，登录后可批量兑换 6 个');
		hiveIds.value = hiveidsList[0];
		return;
	}
	if (hiveidsList.length > 6) {
		ElMessage.error('一次最多支持6个账号！');
		hiveIds.value = hiveidsList.slice(0, 6).join(';');
		return;
	}
	if (parseList(coupons.value).length === 0) {
		ElMessage.error('请输入兑换码！');
		return;
	}
	checkSummoners(hiveidsList);
};

// 先校验召唤师名,确认后再兑换
let checkSummoners = (hiveidsList) => {
	fullscreenLoading.value = true;
	checkRedemption({
		server: serverValue.value,
		hiveIds: hiveidsList
	})
		.then((res) => {
			let checkList = res || [];
			// 存在校验失败的账号直接结束
			let failed = checkList.filter((e) => e.retCode != 100);
			if (failed.length > 0) {
				ElMessage.error(
					failed.map((e) => `${e.hiveid}: ${e.retMsg || '校验失败'}`).join(';')
				);
				return;
			}
			let accountList = checkList
				.map((e) => (e.wizardName ? `${e.wizardName}(${e.hiveid})` : e.hiveid))
				.join('、');
			// 召唤师名随兑换请求落库(兑换记录"召唤师"列)
			let namesMap = {};
			checkList.forEach((e) => {
				if (e.hiveid && e.wizardName) {
					namesMap[e.hiveid] = e.wizardName;
				}
			});
			ElMessageBox.confirm(`是否兑换到以下账号：${accountList}`, '提示', {
				confirmButtonText: '确认',
				cancelButtonText: '取消',
				type: 'warning'
			})
				.then(() => {
					sendRequests(hiveidsList, namesMap);
				})
				.catch(() => {});
		})
		.catch((err) => {
			console.log('check err==', err);
		})
		.finally(() => {
			fullscreenLoading.value = false;
		});
};

// 批量兑换:server 使用所选服务器,names 携带召唤师名落库
let sendRequests = async (hiveidsList, namesMap = {}) => {
	fullscreenLoading.value = true;
	try {
		const res = await redeemCoupons({
			server: serverValue.value,
			hiveIds: hiveidsList,
			codes: parseList(coupons.value),
			names: namesMap
		});
		resultList.value = res || [];
		if (userStore.isLogged) {
			initMineList();
		}
	} catch (err) {
		console.log('redeem err==', err);
	} finally {
		fullscreenLoading.value = false;
	}
};

// 我的兑换记录
let initMineList = async () => {
	mineLoading.value = true;
	try {
		const res = await getMyRedemptions();
		mineList.value = res?.list || [];
	} catch (err) {
		console.error('获取兑换记录失败:', err);
	} finally {
		mineLoading.value = false;
	}
};

let getCouponContent = (coupon) => {
	if (!coupon) {
		return '';
	}
	let curCoupon =
		codeList.value.find((e) => {
			return (e.code || '').toLowerCase() === String(coupon).toLowerCase();
		}) || {};
	return curCoupon.content || '';
};
</script>

<style lang="less">
.coupon_wrapper {
	padding: 20px 24px 32px;
	background-color: #f5f7fa;
	min-height: 100%;

	.page_header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 16px;
		.page_title {
			font-size: 20px;
			font-weight: 600;
			color: #303133;
			padding-left: 10px;
			border-left: 4px solid #409eff;
		}
		.update_time {
			font-size: 12px;
			color: #909399;
		}
	}

	.login_tip {
		margin-bottom: 16px;
	}

	.coupon_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 16px 20px 20px;
		margin-bottom: 16px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);

		.card_header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			flex-wrap: wrap;
			gap: 10px;
			margin-bottom: 14px;
			.card_title {
				font-size: 15px;
				font-weight: 600;
				color: #303133;
				padding-left: 8px;
				border-left: 3px solid #409eff;
			}
			.card_actions {
				display: flex;
				gap: 8px;
			}
		}
	}

	.code_link {
		color: #409eff;
		font-weight: 600;
		letter-spacing: 0.4px;
	}

	.bound_box {
		background: #f8f9fb;
		border: 1px solid #ebeef5;
		border-radius: 8px;
		padding: 10px 14px;
		margin-bottom: 16px;
		.bound_header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 6px;
			.bound_label {
				font-size: 13px;
				font-weight: 600;
				color: #606266;
			}
		}
		.bound_server {
			color: #909399;
			font-size: 12px;
		}
		.bound_remark {
			color: #67c23a;
			font-size: 12px;
			margin-left: 4px;
		}
		.bound_tip {
			font-size: 12px;
			color: #909399;
			margin-top: 6px;
		}
	}

	.form_grid {
		display: grid;
		grid-template-columns: 240px 1fr;
		gap: 14px 16px;
		margin-bottom: 14px;
	}

	.input_item {
		display: flex;
		flex-direction: column;
		gap: 6px;
		&.full {
			margin-bottom: 4px;
		}
		label {
			font-size: 13px;
			color: #606266;
		}
	}

	.submit_bar {
		display: flex;
		justify-content: flex-end;
		margin-top: 6px;
	}

	.result_item {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 10px 14px;
		border-radius: 8px;
		background: #fef0f0;
		border-left: 3px solid #f56c6c;
		margin-bottom: 8px;
		font-size: 13px;
		flex-wrap: wrap;
		&.success {
			background: #f0f9eb;
			border-left-color: #67c23a;
		}
		.r_code {
			font-weight: 600;
			color: #303133;
			min-width: 150px;
		}
		.r_account {
			color: #606266;
			min-width: 100px;
		}
		.r_msg {
			color: #909399;
			flex: 1;
		}
	}

	.success_text {
		color: #67c23a;
	}

	.muted_text {
		color: #c0c4cc;
	}

	@media (max-width: 768px) {
		padding: 12px 12px 24px;
		.form_grid {
			grid-template-columns: 100%;
		}
		.result_item .r_code,
		.result_item .r_account {
			min-width: 0;
		}
	}
}
</style>
