<template>
	<div class="coupon_wrapper" v-loading.fullscreen.lock="fullscreenLoading">
		<div class="title">Summoner's War(魔灵召唤)</div>
		<div class="top_header">
			<div class="button_list">
				<el-button @click="initCodeList()">获取最新兑换码</el-button>
				<el-button @click="setCodeList()">一键填入兑换码</el-button>
				<el-button type="primary" @click="beforeSendRequest()">提交兑换</el-button>
			</div>
			<div class="top_right">
				<span>更新日期：</span>
				<span>{{ updateTime }}</span>
			</div>
		</div>
		<div class="login_tip" v-if="!userStore.isLogged">
			<el-alert
				title="兑换功能需要登录，未登录将跳转登录页"
				type="info"
				show-icon
				:closable="false" />
		</div>
		<div class="code_list">
			<el-table :data="codeList" style="width: 100%" v-loading="onLoading">
				<el-table-column prop="code" label="兑换码" width="180">
					<template #default="scope">
						<a :href="getcouponUrl(scope.row)" target="_blank" rel="noopener">
							<span style="margin-left: 10px">{{ (scope.row.code || '').toUpperCase() }}</span>
						</a>
					</template>
				</el-table-column>
				<el-table-column prop="content" label="内容" />
				<el-table-column prop="created_at" label="创建日期" width="180" />
			</el-table>
		</div>
		<div class="input_list">
			<div class="input_item server">
				<label for="server">服务器选择:</label>
				<el-select v-model="serverValue" placeholder="请选择">
					<el-option
						v-for="item in serverOption"
						:key="item.value"
						:label="item.label"
						:value="item.value"></el-option>
				</el-select>
			</div>
			<div class="input_item">
				<label for="hiveid">Hive ID (多个用分号分隔,最多6个):</label>
				<el-input type="text" id="hiveid" v-model="hiveIds"></el-input>
			</div>
			<div class="input_item">
				<label for="coupon">兑换码 (多个用分号分隔):</label>
				<el-input type="text" id="coupon" v-model="coupons"></el-input>
			</div>
		</div>
		<div class="result_list" v-if="resultList.length > 0">
			<div class="result_title">兑换结果：</div>
			<div class="result_item" v-for="(item, index) in resultList" :key="index">
				<span class="id">Hive ID: {{ item.hiveid }}</span>
				<span class="content">
					兑换码: {{ item.coupon }} ~ {{ getCouponContent(item.coupon) }}
				</span>
				<span class="result" :class="{ success: item.retCode == 100 }">
					{{ item.retMsg || item.error || (item.retCode == 100 ? '成功' : '失败') }}
				</span>
			</div>
		</div>
		<div class="mine_list" v-if="userStore.isLogged">
			<div class="result_title">我的兑换记录：</div>
			<el-table :data="mineList" border v-loading="mineLoading">
				<el-table-column prop="created_at" label="时间" width="180" />
				<el-table-column prop="server" label="服务器" width="120" />
				<el-table-column label="Hive ID">
					<template #default="{ row }">{{ row.hive_id || row.hiveid || '-' }}</template>
				</el-table-column>
				<el-table-column label="兑换码">
					<template #default="{ row }">{{ row.codes || row.coupon || '-' }}</template>
				</el-table-column>
				<el-table-column label="结果">
					<template #default="{ row }">{{ row.retMsg || row.ret_msg || row.result || '-' }}</template>
				</el-table-column>
			</el-table>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getCoupons } from '@/services/coupon';
import { checkRedemption, redeemCoupons, getMyRedemptions } from '@/services/redemption';
import { useUserStore } from '@/stores/user';

const route = useRoute();
const router = useRouter();
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
const serverOption = ref([
	{ value: 'global', label: '全球服务器(Global)' },
	{ value: 'korea', label: '韩国服务器(Korea)' },
	{ value: 'japan', label: '日本服务器(Japan)' },
	{ value: 'china', label: '中国服务器(China)' },
	{ value: 'asia', label: '亚洲服务器(Asia)' },
	{ value: 'europe', label: '欧洲服务器(Europe)' }
]);
const serverValue = ref('china');

onMounted(() => {
	initCodeList();
	if (userStore.isLogged) {
		initMineList();
	}
});

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

// 未登录点击兑换:跳登录页并携带 redirect
const gotoLogin = () => {
	ElMessage.warning('请先登录后再兑换');
	router.push({
		name: 'login',
		query: { redirect: route.fullPath }
	});
};

let beforeSendRequest = () => {
	if (!userStore.isLogged) {
		gotoLogin();
		return;
	}
	let hiveidsList = parseList(hiveIds.value);
	if (hiveidsList.length === 0) {
		ElMessage.error('请输入账号！');
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
			ElMessageBox.confirm(`是否兑换到以下账号：${accountList}`, '提示', {
				confirmButtonText: '确认',
				cancelButtonText: '取消',
				type: 'warning'
			})
				.then(() => {
					sendRequests(hiveidsList);
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

// 批量兑换:server 使用所选服务器
let sendRequests = async (hiveidsList) => {
	fullscreenLoading.value = true;
	try {
		const res = await redeemCoupons({
			server: serverValue.value,
			hiveIds: hiveidsList,
			codes: parseList(coupons.value)
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
	height: calc(100% - 24px);
	padding: 20px;
	background-color: #ffffff;
	.title {
		font-size: 20px;
		font-weight: 600;
		margin: 12px 0;
	}
	.top_header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 12px;
	}
	.login_tip {
		margin-bottom: 12px;
	}
	.code_list {
		.el-table {
			.el-table__row {
				.cell {
					display: -webkit-box;
					-webkit-line-clamp: 2;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}
			}
		}
	}
	.input_list {
		margin-top: 20px;
		.input_item {
			&.server {
				display: flex;
				align-items: center;
				margin-bottom: 12px;
				label {
					white-space: nowrap;
					margin-right: 20px;
				}
				.el-select {
					width: 250px;
				}
			}
		}
	}
	.result_list {
		margin-top: 20px;
		.result_title {
			font-size: 16px;
			font-weight: 600;
			margin-bottom: 8px;
		}
		.result_item {
			.id {
				display: inline-block;
				width: 160px;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
			.content {
				display: inline-block;
				width: 600px;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
			.result {
				&.success {
					color: #67c23a;
				}
			}
		}
	}
	.mine_list {
		margin-top: 24px;
		.result_title {
			font-size: 16px;
			font-weight: 600;
			margin-bottom: 8px;
		}
	}
}
</style>
