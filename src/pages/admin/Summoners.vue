<template>
	<div class="admin_summoners_wrapper">
		<div class="page_header">
			<span class="page_title">召唤师管理</span>
		</div>
		<div class="filter_bar">
			<el-input
				v-model="keyword"
				placeholder="Hive ID / 召唤师名 / 服务器"
				class="filter_input"
				clearable
				@keyup.enter="handleSearch"
				@clear="handleSearch" />
			<el-radio-group v-model="scope" @change="handleSearch">
				<el-radio-button value="all">全部账号</el-radio-button>
				<el-radio-button value="redeemed">仅兑换过</el-radio-button>
			</el-radio-group>
			<el-button type="primary" @click="handleSearch">查询</el-button>
		</div>
		<el-table :data="summonerList" border style="width: 100%" v-loading="listLoading">
			<el-table-column label="Hive ID" min-width="120">
				<template #default="{ row }">{{ row.hiveid }}</template>
			</el-table-column>
			<el-table-column label="召唤师" min-width="160">
				<template #default="{ row }">{{ row.wizard_name || '-' }}</template>
			</el-table-column>
			<el-table-column label="服务器" width="150">
				<template #default="{ row }">{{ getServerLabel(row.server) }}</template>
			</el-table-column>
			<el-table-column label="兑换次数" width="100" sortable prop="total" />
			<el-table-column label="查询次数" width="100" sortable prop="query_count">
				<template #default="{ row }">{{ row.query_count ?? '-' }}</template>
			</el-table-column>
			<el-table-column label="首次兑换" width="170">
				<template #default="{ row }">{{ formatDateTime(row.first_at) }}</template>
			</el-table-column>
			<el-table-column label="最近兑换" width="170">
				<template #default="{ row }">{{ formatDateTime(row.last_at) }}</template>
			</el-table-column>
			<el-table-column label="绑定用户" width="110">
				<template #default="{ row }">{{ row.bound_username || '-' }}</template>
			</el-table-column>
			<el-table-column label="操作" width="90" align="right">
				<template #default="{ row }">
					<el-button type="primary" link @click="openDetail(row)">详情</el-button>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无召唤师数据" :image-size="80" />
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

		<!-- 兑换详情抽屉 -->
		<el-drawer v-model="detailVisible" :title="detailTitle" size="60%">
			<el-table :data="detailList" border v-loading="detailLoading" size="small">
				<el-table-column label="时间" width="165">
					<template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
				</el-table-column>
				<el-table-column label="兑换码" min-width="150">
					<template #default="{ row }">{{ row.code }}</template>
				</el-table-column>
				<el-table-column label="服务器" width="130">
					<template #default="{ row }">{{ getServerLabel(row.server) }}</template>
				</el-table-column>
				<el-table-column label="结果" min-width="180" show-overflow-tooltip>
					<template #default="{ row }">
						<span :class="{ success_text: isSuccess(row) }">{{ row.ret_msg || row.retMsg || '-' }}</span>
					</template>
				</el-table-column>
				<el-table-column label="IP" width="130">
					<template #default="{ row }">{{ row.ip || '-' }}</template>
				</el-table-column>
				<template #empty>
					<el-empty description="该账号暂无兑换记录" :image-size="70" />
				</template>
			</el-table>
			<div class="pagination_box" v-if="detailTotal > detailPageSize">
				<el-pagination
					background
					small
					layout="total, prev, pager, next"
					:total="detailTotal"
					:page-size="detailPageSize"
					:current-page="detailPage"
					@current-change="handleDetailPageChange" />
			</div>
		</el-drawer>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { getAdminSummoners, getAdminRedemptions } from '@/services/admin';
import { getServerLabel } from '@/common/constant';
import { formatDateTime } from '@/utils/format';

const summonerList = ref([]);
const listLoading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const scope = ref('all');

const detailVisible = ref(false);
const detailLoading = ref(false);
const detailTitle = ref('');
const detailList = ref([]);
const detailTotal = ref(0);
const detailPage = ref(1);
const detailPageSize = 20;
const detailHiveid = ref('');

const isSuccess = (row) => row.retCode == 100 || row.ret_code == 100;

const initList = async () => {
	listLoading.value = true;
	try {
		const params = { page: page.value, pageSize: pageSize.value, scope: scope.value };
		if (keyword.value.trim()) {
			params.keyword = keyword.value.trim();
		}
		const res = await getAdminSummoners(params);
		summonerList.value = res?.list || [];
		total.value = Number(res?.total) || 0;
	} catch (e) {
		console.error('获取召唤师列表失败', e);
	} finally {
		listLoading.value = false;
	}
};

const handleSearch = () => {
	page.value = 1;
	initList();
};

const handlePageChange = (newPage) => {
	page.value = newPage;
	initList();
};

const loadDetail = async () => {
	detailLoading.value = true;
	try {
		const res = await getAdminRedemptions({
			hiveid: detailHiveid.value,
			page: detailPage.value,
			pageSize: detailPageSize
		});
		detailList.value = res?.list || [];
		detailTotal.value = Number(res?.total) || 0;
	} catch (e) {
		console.error('获取兑换详情失败', e);
	} finally {
		detailLoading.value = false;
	}
};

const openDetail = (row) => {
	detailHiveid.value = row.hiveid;
	detailTitle.value = `${row.wizard_name || row.hiveid}(${row.hiveid}) 的兑换记录`;
	detailPage.value = 1;
	detailVisible.value = true;
	loadDetail();
};

const handleDetailPageChange = (newPage) => {
	detailPage.value = newPage;
	loadDetail();
};

onMounted(() => {
	initList();
});
</script>

<style lang="less">
.admin_summoners_wrapper {
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
		gap: 8px;
		margin-bottom: 12px;
		.filter_input {
			width: 260px;
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
