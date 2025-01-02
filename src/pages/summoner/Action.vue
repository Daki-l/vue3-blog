<template>
	<div class="summoner_action">
		<el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
			<el-tab-pane label="更新兑换码状态" name="first">
				<el-table
					border
					:data="codeList"
					style="width: 100%"
					v-loading="onLoading"
					:default-sort="{ prop: 'status', order: 'descending' }">
					<el-table-column prop="coupon" label="兑换码" width="180">
						<template #default="scope">
							<a :href="'https://withhive.me/313/' + scope.row.coupon">
								<span style="margin-left: 10px">{{ scope.row.coupon }}</span>
							</a>
						</template>
					</el-table-column>
					<el-table-column prop="content" label="内容" />
					<el-table-column prop="createTime" label="创建日期" width="180" />
					<el-table-column prop="status" label="状态" width="80" sortable>
						<template #default="{ row }">
							<span :class="row.status">{{ row.status }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="action" label="操作" width="100" align="right">
						<template #default="{ row }">
							<el-button
								link
								:type="row.status == 'verified' ? 'danger' : 'primary'"
								@click="updateStatus(row)">
								{{ row.status == 'verified' ? '作废' : '激活' }}
							</el-button>
							<el-button type="primary" link @click="updateContent(row)">修改内容</el-button>
						</template>
					</el-table-column>
				</el-table>
			</el-tab-pane>
		</el-tabs>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import {
	getSummonerCode,
	updateSummonerCode
} from '@/services/summonerServices/summonerServices.js';
import { ElMessage, ElMessageBox } from 'element-plus';

const codeList = ref([]);
const onLoading = ref(false);
const stashTime = ref('');
const activeName = ref('first');

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
	console.log('codeList---', codeList);
};

// 获取最新兑换码信息
let getCodeList = async (props = {}) => {
	onLoading.value = true;
	getSummonerCode(props)
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
			let codeInfo = JSON.parse(localStorage.getItem('codeInfo')) || {};
			stashTime.value = codeInfo.createTime;
			codeList.value = codeInfo.list || [];
		})
		.finally(() => {
			onLoading.value = false;
		});
};

const handleClick = (tab, event) => {
	console.log(tab, event);
};
const updateStatus = (row) => {
	console.log('row---', row);
	let { coupon, content, status } = row;
	status = status == 'verified' ? 'expired' : 'verified';
	let params = {
		coupon,
		content,
		status
	};
	onLoading.value = true;
	updateSummonerCode(params)
		.then((res) => {
			console.log('result----', res);
			ElMessage.success('更新成功');
			onLoading.value = false;
			getCodeList();
		})
		.catch((error) => {
			onLoading.value = false;
			ElMessage.error(error);
		});
};
const updateContent = (row) => {
	console.log('updateContent---', row);
	ElMessage.info('待开发！');
};
</script>

<style lang="less" scoped>
.summoner_action {
	.el-table {
		.expired {
			color: red;
		}
		.verified {
			color: #3ec73e;
		}
	}
}
</style>