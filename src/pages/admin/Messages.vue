<template>
	<div class="admin_messages_wrapper">
		<div class="page_header">
			<span class="page_title">留言管理</span>
			<el-button link type="primary" :loading="messageLoading" @click="initMessageList">刷新</el-button>
		</div>
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
					<span>{{ formatDateTime(row.created_at || row.createTime) }}</span>
				</template>
			</el-table-column>
			<el-table-column prop="action" label="操作" width="230" align="right">
				<template #default="{ row }">
					<el-button type="primary" link v-if="!row.__isReply" @click="openReplyDialog(row)">
						回复
					</el-button>
					<el-button type="primary" link @click="openUpdateMessageDialog(row)">修改内容</el-button>
					<el-button
						:type="row.status === 'hidden' ? 'success' : 'warning'"
						link
						@click="handleToggleHide(row)">
						{{ row.status === 'hidden' ? '恢复' : '隐藏' }}
					</el-button>
					<el-popconfirm title="确认彻底删除该条内容？(隐藏可恢复,删除不可)" @confirm="handleDeleteMessage(row)">
						<template #reference>
							<el-button type="danger" link>删除</el-button>
						</template>
					</el-popconfirm>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无留言" :image-size="80" />
			</template>
		</el-table>

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
	getAdminMessages,
	updateMessage,
	deleteMessage,
	updateReply,
	deleteReply
} from '@/services/admin';
import { addReply } from '@/services/message';
import { useUserStore } from '@/stores/user';
import { formatDateTime } from '@/utils/format';

const userStore = useUserStore();

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

// 隐藏/恢复(软删,前台不显示)
const handleToggleHide = (row) => {
	const next = row.status === 'hidden' ? 'visible' : 'hidden';
	const request = row.__isReply ? updateReply : updateMessage;
	request(row.id, { status: next })
		.then(() => {
			ElMessage.success(next === 'hidden' ? '已隐藏(前台不可见)' : '已恢复展示');
			initMessageList();
		})
		.catch((e) => {
			console.error('操作失败', e);
		});
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

onMounted(() => {
	initMessageList();
});
</script>

<style lang="less">
.admin_messages_wrapper {
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
