<template>
	<div class="message_board">
		<div class="message_list" v-loading="loading">
			<div v-for="msg in messageList" :key="msg.id" class="message_item">
				<div class="message-content">
					<div class="message_header">
						<span class="nickname">{{ msg.nickname }}</span>
						<span class="time">{{ formatDateTime(msg.created_at || msg.createTime) }}</span>
					</div>
					<div class="message_body">{{ msg.content }}</div>
					<div class="message_footer">
						<button @click="toggleReplyForm(msg.id)" class="reply_btn">回复</button>
					</div>
				</div>

				<!-- 显示回复列表 -->
				<div v-if="msg.replies && msg.replies.length > 0" class="replies">
					<div v-for="reply in msg.replies" :key="reply.id" class="reply_item">
						<span class="nickname">{{ reply.nickname }}</span>
						<span class="time">{{ formatDateTime(reply.created_at || reply.createTime) }}</span>
						<p>{{ reply.content }}</p>
					</div>
				</div>

				<!-- 回复区 -->
				<div v-if="replyingTo === msg.id" class="reply_form">
					<el-input
						v-model="replyNickName"
						placeholder="输入你的昵称"
						class="reply_nickName"></el-input>
					<el-input
						type="textarea"
						v-model="replyContent"
						placeholder="输入你的回复..."
						class="reply_textarea"></el-input>
					<el-button @click="addReply(msg.id)" :disabled="loading" class="send_btn">
						{{ loading ? '提交中...' : '发送回复' }}
					</el-button>
				</div>
			</div>
			<el-empty v-if="!loading && messageList.length === 0" description="还没有留言，快来抢沙发~" />
		</div>
		<div class="pagination_box" v-if="total > 0">
			<el-pagination
				background
				layout="prev, pager, next"
				:total="total"
				:page-size="pageSize"
				:current-page="page"
				@current-change="handlePageChange"></el-pagination>
		</div>
		<div class="add_message">
			<el-input
				v-model="nickname"
				type="text"
				placeholder="请输入你的昵称"
				class="nickname_input"></el-input>
			<el-input
				type="textarea"
				v-model="messageContent"
				placeholder="输入你的留言..."
				class="message_textarea"></el-input>
			<el-button @click="addMessage" :disabled="loading" class="send_btn">
				{{ loading ? '提交中...' : '发送留言' }}
			</el-button>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getMessages, addMessage as addMessageApi, addReply as addReplyApi } from '@/services/message';
import { useUserStore } from '@/stores/user';
import { formatDateTime } from '@/utils/format';

const userStore = useUserStore();

// 数据
const nickname = ref('');
const messageContent = ref('');
const replyContent = ref('');
const replyNickName = ref('');
const messageList = ref([]);
const replyingTo = ref(null);
const loading = ref(false);
const page = ref(1);
const total = ref(0);
const pageSize = ref(20);

onMounted(() => {
	// 登录用户昵称自动填充(可修改)
	if (userStore.isLogged && userStore.displayName) {
		nickname.value = userStore.displayName;
	}
	getMessageList();
});

const handlePageChange = (newPage) => {
	page.value = newPage;
	getMessageList();
};

// 获取留言列表
const getMessageList = async () => {
	loading.value = true;
	try {
		const response = await getMessages(page.value);
		messageList.value = response?.list || [];
		total.value = response?.total || 0;
		// 用首页返回条数推断后端分页大小,保证分页器页码正确
		if (page.value === 1 && messageList.value.length > 0) {
			pageSize.value = messageList.value.length;
		}
	} catch (error) {
		console.error('获取留言失败', error);
	} finally {
		loading.value = false;
	}
};

// 新增留言(游客可发)
const addMessage = async () => {
	if (!nickname.value.trim() || !messageContent.value.trim()) {
		ElMessage.warning('昵称和留言内容不能为空！');
		return;
	}
	loading.value = true;
	try {
		await addMessageApi({
			nickname: nickname.value.trim(),
			content: messageContent.value.trim()
		});
		getMessageList();
		messageContent.value = '';
		ElMessage.success('留言成功！');
	} catch (error) {
		// 429 等错误提示由 axios 拦截器统一处理(发言太频繁)
		console.error('留言失败', error);
	} finally {
		loading.value = false;
	}
};

// 新增回复(游客可发)
const addReply = async (messageId) => {
	if (!replyContent.value.trim()) {
		ElMessage.warning('回复内容不能为空！');
		return;
	}
	if (!replyNickName.value.trim()) {
		ElMessage.warning('回复昵称不能为空！');
		return;
	}
	loading.value = true;
	try {
		await addReplyApi(messageId, {
			nickname: replyNickName.value.trim(),
			content: replyContent.value.trim()
		});
		getMessageList();
		replyContent.value = '';
		replyingTo.value = null;
		ElMessage.success('回复成功！');
	} catch (error) {
		// 429 等错误提示由 axios 拦截器统一处理
		console.error('回复失败', error);
	} finally {
		loading.value = false;
	}
};

// 切换显示回复框
const toggleReplyForm = (messageId) => {
	replyingTo.value = replyingTo.value === messageId ? null : messageId;
	if (replyingTo.value !== null) {
		// 回复昵称默认:登录用户用昵称,游客用留言昵称或空
		replyNickName.value = userStore.isLogged && userStore.displayName
			? userStore.displayName
			: nickname.value;
	}
};
</script>

<style lang="less">
.message_board {
	max-width: 800px;
	height: 100%;
	margin: 0 auto;
	padding: 0 20px 20px;
	overflow: hidden;
	background-color: #ffffff;
	.message_list {
		margin-top: 20px;
		height: calc(100% - 140px - 50px);
		overflow: auto;
	}
	.pagination_box {
		display: flex;
		justify-content: center;
		margin-top: 10px;
	}
	.add_message {
		margin: 10px 0;
		height: 140px;
		overflow: hidden;
		.nickname_input {
			width: 100%;
			margin-bottom: 10px;
		}

		.message_textarea {
			width: 100%;
			resize: vertical;
		}
		.send_btn {
			margin-top: 10px;
			float: right;
			background-color: #4caf50;
			color: white;
			border: none;
			cursor: pointer;
			font-size: 16px;
		}
	}
}

.send_btn:disabled {
	background-color: #ccc;
	cursor: not-allowed;
}
.message_item {
	background: #f9f9f9;
	border-radius: 5px;
	padding: 15px;
	margin-bottom: 10px;
	overflow: hidden;
	.message_header {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
		color: #999;
	}
	.message_body {
	}
	.message_footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		.message_time {
			margin-right: 12px;
			font-size: 12px;
			color: #5f809b;
		}
	}
	.reply_btn {
		float: right;
		background-color: #2196f3;
		color: white;
		border: none;
		cursor: pointer;
		font-size: 14px;
	}
}

.reply_form {
	margin-top: 10px;
}
.reply_nickName {
	width: 100%;
	height: 32px;
	margin-bottom: 8px;
}
.reply_textarea {
	width: 100%;
	margin-bottom: 8px;
}

.replies {
	margin-top: 10px;
	padding-left: 20px;
}

.reply_item {
	background-color: #f1f1f1;
	padding: 10px;
	border-radius: 5px;
	margin-bottom: 5px;
}

.nickname {
	font-weight: bold;
}

.time {
	font-size: 12px;
	color: #aaa;
}

/* 手机 web:容器全宽,内边距压缩,列表自然展开由 layout-content 滚动 */
@media (max-width: 768px) {
	.message_board {
		max-width: 100%;
		padding: 0 10px 10px;
		overflow: visible;
		.message_list {
			height: auto;
			overflow: visible;
		}
		.add_message {
			height: auto;
			overflow: visible;
		}
	}
	.message_item {
		padding: 10px;
		.message_header {
			flex-wrap: wrap;
		}
	}
	.replies {
		padding-left: 8px;
	}
}
</style>
