<template>
	<div class="coupon_wrapper" v-loading.fullscreen.lock="fullscreenLoading">
		<div class="title">魔灵召唤 兑换码 直兑</div>
		<div class="button_list">
			<el-button @click="getCodeList()">获取最新兑换码</el-button>
			<el-button @click="setCodeList()">一键填入兑换码</el-button>
			<el-button @click="getUserInfo()">查询召唤师</el-button>
			<el-button @click="sendRequests()">提交兑换</el-button>
		</div>
		<div class="code_list">
			<div class="code_top">
				<div class="top_left"></div>
				<div class="top_right">
					<span>更新日期：</span>
					<span>{{ stashTime }}</span>
				</div>
			</div>
			<el-table :data="codeList" style="width: 100%" v-loading="onLoading">
				<el-table-column prop="coupon" label="兑换码" width="180">
					<template #default="scope">
						<a :href="'https://withhive.me/313/' + scope.row.coupon">
							<span style="margin-left: 10px">{{ scope.row.coupon }}</span>
						</a>
					</template>
				</el-table-column>
				<el-table-column prop="content" label="内容" />
				<el-table-column prop="createTime" label="创建日期" width="180" />
			</el-table>
			<!-- <div class="codeListMap">
                <span>兑换码列表：</span>
                <span>{{ codeList.map(e => e.coupon).join(';') }}</span>
            </div> -->
		</div>
		<div class="input_list">
			<div>
				<label for="hiveid">Hive ID (多个用分号分隔):</label>
				<br />
				<el-input type="text" id="hiveid" v-model="hiveIds"></el-input>
			</div>
			<div>
				<label for="coupon">兑换码 (多个用分号分隔):</label>
				<br />
				<el-input type="text" id="coupon" v-model="coupons"></el-input>
			</div>
		</div>
		<div class="result_list">
			<div class="result_item" v-for="(item, index) in resultList" :key="index">
				<span class="id">Hive ID: {{ item.hiveid }}</span>
				<span class="content">兑换码: {{ item.coupon }} ~ {{ getCouponContent(item.coupon) }}</span>
				<span class="result">{{ JSON.stringify(item.result) }}</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import {
	getSummonerCode,
	getSummonerUserInfo,
	setCodeToUser
} from '@/services/summonerServices/summonerServices.js';

const hiveIds = ref('');
const coupons = ref('');
const codeList = ref([]);
const resultList = ref([]);
const onLoading = ref(false);
const fullscreenLoading = ref(false);
const stashTime = ref('');
onMounted(() => {
	initCodeList();
});

let initCodeList = () => {
	let codeInfo = JSON.parse(localStorage.getItem('codeInfo')) || {};
	let currentDate = new Date().toISOString().split('T')[0];
	if (codeInfo.createTime === currentDate) {
		stashTime.value = currentDate;
		codeList.value = codeInfo.list || [];
	} else {
		getCodeList();
	}
};

// 获取最新兑换码信息
let getCodeList = async () => {
	onLoading.value = true;
	getSummonerCode()
		.then((res) => {
			let { createTime, list } = res;
			let curList = list.map((e) => {
				e.coupon = e.coupon.toLowerCase();
				return e;
			});
			localStorage.setItem('codeInfo', JSON.stringify(res));
			codeList.value = curList || [];
			stashTime.value = createTime;
		})
		.catch((err) => {
			console.error('获取数据时出错:', err);
		})
		.finally(() => {
			onLoading.value = false;
		});
};

let setCodeList = () => {
	let codesStr = codeList.value
		.map((e) => {
			return e.coupon;
		})
		.join(';');
	coupons.value = codesStr || '';
};
// 获取召唤师名称
let getUserInfo = () => {
	let hiveidsList = hiveIds.value.split(';').map((id) => id.trim());
	fullscreenLoading.value = true;
	let promiseList = [];

	hiveidsList.forEach((e) => {
		let params = {
			country: 'CN',
			lang: 'zh-hans',
			server: 'china',
			hiveid: e,
			coupon: 'xxx'
		};
		promiseList.push({
			fn: getSummonerUserInfo(params),
			...params
		});
	});
	Promise.all(promiseList.map((e) => e.fn))
		.then((data) => {
			let list = [];
			data.forEach((e, endex) => {
				let curUser = promiseList[endex];
				let { retCode, retMsg, userData = {} } = e;
				if (retCode != 100) {
					list.push({
						result: { retCode, retMsg },
						hiveid: curUser.hiveid,
						coupon: curUser.coupon
					});
				} else {
					list.push({ result: userData, hiveid: curUser.hiveid, coupon: curUser.coupon });
				}
			});
			resultList.value = list;
		})
		.catch((err) => {
			console.log('err==', err);
		})
		.finally(() => {
			fullscreenLoading.value = false;
		});
};

// 批量兑换兑换码
let sendRequests = async () => {
	let hiveidsList = hiveIds.value.split(';').map((id) => id.trim());
	let couponsList = coupons.value.split(';').map((c) => c.trim());
	fullscreenLoading.value = true;
	let promiseList = [];

	for (let hiveid of hiveidsList) {
		for (let coupon of couponsList) {
			let params = {
				country: 'CN',
				lang: 'zh-hans',
				server: 'china',
				hiveid,
				coupon
			};
			promiseList.push({
				fn: setCodeToUser(params),
				hiveid,
				coupon
			});
		}
	}
	Promise.all(promiseList.map((e) => e.fn))
		.then((data) => {
			let list = [];
			data.forEach((e, endex) => {
				let curUser = promiseList[endex];
				list.push({ result: e, hiveid: curUser.hiveid, coupon: curUser.coupon });
			});
			resultList.value = list;
		})
		.catch((err) => {
			console.log('err==', err);
		})
		.finally(() => {
			fullscreenLoading.value = false;
		});
};
let getCouponContent = (coupon) => {
	let curCoupon =
		codeList.value.find((e) => {
			return e.coupon === coupon;
		}) || {};
	return curCoupon.content;
};
</script>

<style lang="less">
.coupon_wrapper {
	height: calc(100% - 24px);
	.title {
		font-size: 20px;
		font-weight: 600;
		margin: 12px 0;
	}
	.button_list {
	}
	.code_list {
		.code_top {
			display: flex;
			justify-content: space-between;
		}
	}
	.input_list {
		margin-top: 20px;
	}
	.result_list {
		margin-top: 20px;
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
			}
		}
	}
}
</style>