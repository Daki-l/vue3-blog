<template>
	<div class="admin_wrapper">
		<el-tabs v-model="activeName" class="admin_tabs" @tab-change="handleTabChange">
			<!-- Tab1 兑换码管理 -->
			<el-tab-pane label="兑换码管理" name="coupon">
				<div class="toolbar">
					<div class="add_form">
						<el-input
							v-model="newCoupon.code"
							placeholder="兑换码"
							class="add_input"
							clearable />
						<el-input
							v-model="newCoupon.content"
							placeholder="内容"
							class="add_input"
							clearable />
						<el-button type="primary" :loading="addLoading" @click="submitAddCoupon">
							新增兑换码
						</el-button>
					</div>
					<div class="sync_btns">
						<el-button type="warning" :loading="syncCouponLoading" @click="handleSyncCoupons">
							立即抓取
						</el-button>
						<el-button type="success" :loading="syncNoticeLoading" @click="handleSyncNotices">
							同步公告
						</el-button>
						<span class="update_time" v-if="updateTime">更新时间：{{ updateTime }}</span>
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
					<el-table-column prop="created_at" label="创建日期" width="140" sortable />
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
				</el-table>
			</el-tab-pane>

			<!-- Tab2 留言管理 -->
			<el-tab-pane label="留言管理" name="message">
				<el-table
					:border="true"
					:data="messageList"
					lazy
					row-key="id"
					style="width: 100%"
					default-expand-all
					:tree-props="{ children: 'replies', hasChildren: 'hasChildren' }"
					v-loading="messageLoading">
					<el-table-column prop="nickname" label="名称" width="140" align="left">
						<template #default="{ row }">
							<span class="message_nickname">{{ row.nickname }}</span>
							<el-tag v-if="row.__isReply" size="small" type="info" class="reply_tag">回复</el-tag>
						</template>
					</el-table-column>
					<el-table-column prop="content" label="内容" />
					<el-table-column prop="created_at" label="创建日期" width="180">
						<template #default="{ row }">
							<span>{{ row.created_at || row.createTime || '-' }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="action" label="操作" width="160" align="right">
						<template #default="{ row }">
							<el-button type="primary" link v-if="!row.__isReply" @click="openReplyDialog(row)">
								回复
							</el-button>
							<el-button type="primary" link @click="openUpdateMessageDialog(row)">修改内容</el-button>
							<el-popconfirm title="确认删除该条内容！" @confirm="handleDeleteMessage(row)">
								<template #reference>
									<el-button type="danger" link>删除</el-button>
								</template>
							</el-popconfirm>
						</template>
					</el-table-column>
				</el-table>
			</el-tab-pane>
		</el-tabs>

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

		<!-- 回复留言弹窗 -->
		<el-dialog v-model="replyDialogVisible" title="回复留言" width="500">
			<div class="dialog_origin">{{ replyTarget?.content || '-' }}</div>
			<el-input v-model="replyForm.nickname" placeholder="输入你的昵称" class="dialog_input" />
			<el-input
				type="textarea"
				v-model="replyForm.content"
				placeholder="输入你的回复..."
				:rows="4" />
			<template #footer>
				<el-button @click="replyDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="replyDialogLoading" @click="submitReply">发送回复</el-button>
			</template>
		</el-dialog>

		<!-- 修改留言/回复内容弹窗 -->
		<el-dialog v-model="updateDialogVisible" title="修改内容" width="500">
			<div class="dialog_origin">{{ updateTarget?.content || '-' }}</div>
			<el-input
				type="textarea"
				v-model="updateContent"
				placeholder="输入更改后的内容"
				:rows="4" />
			<template #footer>
				<el-button @click="updateDialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="updateDialogLoading" @click="submitUpdateMessage">
					修改内容
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
	addCoupon,
	updateCoupon,
	syncCoupons,
	syncNotices,
	getAdminMessages,
	updateMessage,
	deleteMessage,
	updateReply,
	deleteReply
} from '@/services/admin';
import { addReply } from '@/services/message';
import { getAdminCoupons } from '@/services/admin';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

const activeName = ref('coupon');

// ===== 兑换码管理 =====
const couponList = ref([]);
const couponLoading = ref(false);
const updateTime = ref('');
const addLoading = ref(false);
const syncCouponLoading = ref(false);
const syncNoticeLoading = ref(false);
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

const handleSyncNotices = async () => {
	syncNoticeLoading.value = true;
	try {
		await syncNotices();
		ElMessage.success('公告同步任务已提交！');
	} catch (e) {
		console.error('同步公告失败', e);
	} finally {
		syncNoticeLoading.value = false;
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

// ===== 留言管理 =====
const messageList = ref([]);
const messageLoading = ref(false);

const initMessageList = async () => {
	messageLoading.value = true;
	try {
		const res = await getAdminMessages();
		let list = (res?.list || []).map((msg) => {
			msg.hasChildren = (msg.replies || []).length > 0;
			msg.replies = (msg.replies || []).map((reply) => ({
				...reply,
				__isReply: true
			}));
			return msg;
		});
		messageList.value = list;
	} catch (e) {
		console.error('获取留言失败', e);
	} finally {
		messageLoading.value = false;
	}
};

// 回复留言
const replyDialogVisible = ref(false);
const replyDialogLoading = ref(false);
const replyTarget = ref(null);
const replyForm = reactive({
	nickname: '',
	content: ''
});

const openReplyDialog = (row) => {
	replyTarget.value = row;
	replyForm.nickname = userStore.displayName || '管理员';
	replyForm.content = '';
	replyDialogVisible.value = true;
};

const submitReply = async () => {
	if (!replyForm.content.trim()) {
		ElMessage.warning('回复内容不能为空！');
		return;
	}
	replyDialogLoading.value = true;
	try {
		await addReply(replyTarget.value.id, {
			nickname: replyForm.nickname.trim() || '管理员',
			content: replyForm.content.trim()
		});
		ElMessage.success('回复成功！');
		replyDialogVisible.value = false;
		initMessageList();
	} catch (e) {
		console.error('回复失败', e);
	} finally {
		replyDialogLoading.value = false;
	}
};

// 修改留言/回复内容
const updateDialogVisible = ref(false);
const updateDialogLoading = ref(false);
const updateTarget = ref(null);
const updateContent = ref('');

const openUpdateMessageDialog = (row) => {
	updateTarget.value = row;
	updateContent.value = row.content || '';
	updateDialogVisible.value = true;
};

const submitUpdateMessage = async () => {
	if (!updateContent.value.trim()) {
		ElMessage.warning('内容不能为空！');
		return;
	}
	updateDialogLoading.value = true;
	try {
		let request = updateTarget.value.__isReply ? updateReply : updateMessage;
		await request(updateTarget.value.id, { content: updateContent.value.trim() });
		ElMessage.success('修改成功！');
		updateDialogVisible.value = false;
		initMessageList();
	} catch (e) {
		console.error('修改失败', e);
	} finally {
		updateDialogLoading.value = false;
	}
};

// 删除留言/回复
const handleDeleteMessage = (row) => {
	let request = row.__isReply ? deleteReply : deleteMessage;
	request(row.id)
		.then(() => {
			ElMessage.success('删除成功！');
			initMessageList();
		})
		.catch((e) => {
			console.error('删除失败', e);
		});
};

const handleTabChange = (tab) => {
	if (tab === 'coupon') {
		initCouponList();
	} else if (tab === 'message') {
		initMessageList();
	}
};

onMounted(() => {
	initCouponList();
});
</script>

<style lang="less">
.admin_wrapper {
	background-color: #ffffff;
	min-height: 100%;
	.admin_tabs {
		padding: 6px 24px 24px;
		.el-tabs__header {
			margin-bottom: 12px;
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
	.dialog_origin {
		margin-bottom: 14px;
		color: #606266;
		background: #f5f7fa;
		padding: 10px;
		border-radius: 4px;
	}
	.dialog_input {
		margin-bottom: 8px;
	}
}
</style>
