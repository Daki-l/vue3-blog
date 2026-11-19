<template>
	<div class="admin_coupons_wrapper">
		<div class="page_header">
			<span class="page_title">兑换码管理</span>
			<div class="sync_btns">
				<el-button type="warning" :loading="syncCouponLoading" @click="handleSyncCoupons">
					立即抓取
				</el-button>
				<span class="update_time" v-if="updateTime">更新时间：{{ formatDateTime(updateTime) }}</span>
			</div>
		</div>
		<div class="toolbar">
			<div class="add_form">
				<el-input v-model="newCoupon.code" placeholder="兑换码" class="add_input" clearable />
				<el-input v-model="newCoupon.content" placeholder="内容" class="add_input" clearable />
				<el-button type="primary" :loading="addLoading" @click="submitAddCoupon">
					新增兑换码
				</el-button>
			</div>
		</div>
		<el-table
			:border="true"
			:data="couponList"
			style="width: 100%"
			v-loading="couponLoading"
			:default-sort="{ prop: 'status', order: 'descending' }">
			<el-table-column prop="code" label="兑换码" width="200" sortable>
				<template #default="scope">
					<a :href="getcouponUrl(scope.row)" target="_blank" rel="noopener">
						<span style="margin-left: 10px">{{ (scope.row.code || '').toUpperCase() }}</span>
					</a>
				</template>
			</el-table-column>
			<el-table-column prop="content" label="内容" />
			<el-table-column prop="source" label="来源" width="120" />
			<el-table-column prop="created_at" label="创建日期" width="120" sortable />
			<el-table-column label="最后有效兑换" width="170" sortable prop="last_success_at">
				<template #default="{ row }">
					<span v-if="row.last_success_at" style="color: #67c23a">{{ formatDateTime(row.last_success_at) }}</span>
					<span v-else style="color: #c0c4cc">-</span>
				</template>
			</el-table-column>
			<el-table-column prop="status" label="状态" width="100" sortable>
				<template #default="{ row }">
					<el-tag :type="isCouponActive(row) ? 'success' : 'danger'">
						{{ isCouponActive(row) ? '有效' : '已作废' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column prop="action" label="操作" width="180" align="right">
				<template #default="{ row }">
					<el-button
						link
						:type="isCouponActive(row) ? 'danger' : 'primary'"
						@click="toggleCouponStatus(row)">
						{{ isCouponActive(row) ? '作废' : '激活' }}
					</el-button>
					<el-button type="primary" link @click="openCouponDialog(row)">修改内容</el-button>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无兑换码" :image-size="80" />
			</template>
		</el-table>

		<!-- 新增/修改兑换码内容弹窗 -->
		<el-dialog
			v-model="couponDialogVisible"
			:title="'修改兑换码内容：' + couponDialogTitle"
			width="500">
			<el-input
				type="textarea"
				v-model="couponDialogContent"
				placeholder="输入更改后的内容"
				:rows="4" />
			<template #footer>
				<el-button @click="couponDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="couponDialogLoading" @click="submitCouponContent">
					修改内容
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getAdminCoupons, addCoupon, updateCoupon, syncCoupons } from '@/services/admin';
import { formatDateTime } from '@/utils/format';

const couponList = ref([]);
const couponLoading = ref(false);
const updateTime = ref('');
const addLoading = ref(false);
const syncCouponLoading = ref(false);
const newCoupon = reactive({
	code: '',
	content: ''
});

const isCouponActive = (row) => {
	// 除 expired 外均视为有效(active/verified/...)
	return row.status !== 'expired';
};

const initCouponList = async () => {
	couponLoading.value = true;
	try {
		const res = await getAdminCoupons();
		couponList.value = res?.list || [];
		updateTime.value = res?.updateTime || '';
	} catch (e) {
		console.error('获取兑换码失败', e);
	} finally {
		couponLoading.value = false;
	}
};

const getcouponUrl = (row) => {
	return row.url || `https://withhive.me/313/${row.code}`;
};

const submitAddCoupon = async () => {
	let code = newCoupon.code.trim();
	let content = newCoupon.content.trim();
	if (!code) {
		ElMessage.warning('请输入兑换码！');
		return;
	}
	if (!content) {
		ElMessage.warning('请输入兑换码内容！');
		return;
	}
	addLoading.value = true;
	try {
		await addCoupon({ code, content });
		ElMessage.success('新增成功！');
		newCoupon.code = '';
		newCoupon.content = '';
		initCouponList();
	} catch (e) {
		console.error('新增兑换码失败', e);
	} finally {
		addLoading.value = false;
	}
};

const toggleCouponStatus = (row) => {
	let nextStatus = isCouponActive(row) ? 'expired' : 'verified';
	couponLoading.value = true;
	updateCoupon(row.code, { status: nextStatus })
		.then(() => {
			ElMessage.success(isCouponActive(row) ? '已作废' : '已激活');
			initCouponList();
		})
		.catch((e) => {
			console.error('更新状态失败', e);
		})
		.finally(() => {
			couponLoading.value = false;
		});
};

const handleSyncCoupons = async () => {
	syncCouponLoading.value = true;
	try {
		await syncCoupons();
		ElMessage.success('抓取任务已提交！');
		initCouponList();
	} catch (e) {
		console.error('抓取失败', e);
	} finally {
		syncCouponLoading.value = false;
	}
};

// 修改兑换码内容
const couponDialogVisible = ref(false);
const couponDialogLoading = ref(false);
const couponDialogTitle = ref('');
const couponDialogContent = ref('');
const couponDialogTarget = ref(null);

const openCouponDialog = (row) => {
	couponDialogTarget.value = row;
	couponDialogTitle.value = row.code;
	couponDialogContent.value = row.content || '';
	couponDialogVisible.value = true;
};

const submitCouponContent = async () => {
	if (!couponDialogContent.value.trim()) {
		ElMessage.warning('内容不能为空！');
		return;
	}
	couponDialogLoading.value = true;
	try {
		await updateCoupon(couponDialogTarget.value.code, {
			content: couponDialogContent.value.trim()
		});
		ElMessage.success('修改成功！');
		couponDialogVisible.value = false;
		initCouponList();
	} catch (e) {
		console.error('修改兑换码失败', e);
	} finally {
		couponDialogLoading.value = false;
	}
};

onMounted(() => {
	initCouponList();
});
</script>

<style lang="less">
.admin_coupons_wrapper {
	.page_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		.page_title {
			font-size: 18px;
			font-weight: 600;
		}
		.sync_btns {
			display: flex;
			align-items: center;
			gap: 8px;
			.update_time {
				color: #909399;
				font-size: 12px;
			}
		}
	}
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 12px;
		.add_form {
			display: flex;
			align-items: center;
			gap: 8px;
			.add_input {
				width: 220px;
			}
		}
	}
	.el-table {
		.el-table__cell {
			padding: 4px 0;
		}
		.cell {
			.el-table__placeholder {
				display: none;
			}
		}
	}
}
</style>
