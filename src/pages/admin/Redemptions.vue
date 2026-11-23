<template>
	<div class="admin_redemptions_wrapper">
		<div class="page_header">
			<span class="page_title">兑换记录</span>
		</div>
		<div class="filter_bar">
			<el-input
				v-model="filters.hiveid"
				placeholder="Hive 账号"
				class="filter_input"
				clearable />
			<el-input
				v-model="filters.code"
				placeholder="兑换码"
				class="filter_input"
				clearable />
			<el-date-picker
				v-model="filters.date"
				type="date"
				placeholder="按日期过滤"
				value-format="YYYY-MM-DD"
				clearable
				class="filter_date" />
			<el-button type="primary" @click="handleSearch">查询</el-button>
			<el-button @click="handleReset">重置</el-button>
		</div>
		<el-table :data="redemptionList" border style="width: 100%" v-loading="listLoading">
			<el-table-column prop="created_at" label="时间" width="180" sortable>
				<template #default="{ row }">{{ formatDateTime(row.created_at || row.createdAt) }}</template>
			</el-table-column>
			<el-table-column label="站点用户" width="140">
				<template #default="{ row }">
					<template v-if="row.username">
						{{ row.username }}<el-tag v-if="Number(row.attributed) === 1" size="small" type="info" style="margin-left: 4px">绑定</el-tag>
					</template>
						<span v-else>-</span>
					</template>
				</el-table-column>
				<el-table-column label="来源" width="80" align="center">
					<template #default="{ row }">
						<el-tag v-if="row.source === 'auto'" size="small" type="warning">自动</el-tag>
						<span v-else>手动</span>
					</template>
				</el-table-column>
				<el-table-column label="召唤师" min-width="140">
				<template #default="{ row }">{{ row.wizard_name || '-' }}</template>
			</el-table-column>
			<el-table-column label="服务器" width="150">
				<template #default="{ row }">{{ getServerLabel(row.server) }}</template>
			</el-table-column>
			<el-table-column label="Hive ID" min-width="120">
				<template #default="{ row }">{{ row.hiveid || row.hive_id || '-' }}</template>
			</el-table-column>
			<el-table-column label="兑换码" min-width="150">
				<template #default="{ row }">{{ row.code || row.coupon || row.codes || '-' }}</template>
			</el-table-column>
			<el-table-column label="结果" min-width="160" show-overflow-tooltip>
				<template #default="{ row }">
					<span :class="{ success_text: isSuccess(row) }">
						{{ row.retMsg || row.ret_msg || row.result || (isSuccess(row) ? '成功' : '-') }}
					</span>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无兑换记录" :image-size="80" />
			</template>
		</el-table>
		<div class="pagination_box" v-if="total > pageSize">
			<el-pagination
				background
				layout="total, prev, pager, next"
				:total="total"
				:page-size="pageSize"
				:current-page="page"
				@current-change="handlePageChange" />
		</div>
	</div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { getAdminRedemptions } from '@/services/admin';
import { getServerLabel } from '@/common/constant';
import { formatDateTime } from '@/utils/format';

const redemptionList = ref([]);
const listLoading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const filters = reactive({
	hiveid: '',
	code: '',
	date: ''
});

const isSuccess = (row) => {
	return row.retCode == 100 || row.ret_code == 100 || row.result === 'success';
};

const initList = async () => {
	listLoading.value = true;
	try {
		const params = {
			page: page.value,
			pageSize: pageSize.value
		};
		if (filters.hiveid.trim()) {
			params.hiveid = filters.hiveid.trim();
		}
		if (filters.code.trim()) {
			params.code = filters.code.trim();
		}
		if (filters.date) {
			params.date = filters.date;
		}
		const res = await getAdminRedemptions(params);
		redemptionList.value = res?.list || [];
		total.value = Number(res?.total) || 0;
	} catch (e) {
		console.error('获取兑换记录失败', e);
	} finally {
		listLoading.value = false;
	}
};

const handleSearch = () => {
	page.value = 1;
	initList();
};

const handleReset = () => {
	filters.hiveid = '';
	filters.code = '';
	filters.date = '';
	page.value = 1;
	initList();
};

const handlePageChange = (newPage) => {
	page.value = newPage;
	initList();
};

onMounted(() => {
	initList();
});
</script>

<style lang="less">
.admin_redemptions_wrapper {
	.page_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		.page_title {
			font-size: 18px;
			font-weight: 600;
		}
	}
	.filter_bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 12px;
		.filter_input {
			width: 180px;
		}
		.filter_date {
			width: 160px;
		}
	}
	.pagination_box {
		display: flex;
		justify-content: center;
		margin-top: 12px;
	}
	.success_text {
		color: #67c23a;
	}
}
</style>
