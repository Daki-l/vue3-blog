<template>
	<div class="message_board">
		<div class="message_list" v-loading="loading">
			<div v-for="msg in messages" :key="msg.messageId" class="message_item">
				<div class="message-content">
					<div class="message_header">
						<span class="nickname">{{ msg.nickname }}</span>
						<span class="time">{{ msg.createTime }}</span>
					</div>
					<div class="message_body">{{ msg.content }}</div>
					<div class="message_footer">
						<div class="message_time">
							{{ new Date(msg.timestamp).format('yyyy-MM-dd HH:mm:ss') }}
						</div>
						<button
							v-if="msg.notReply !== '1'"
							@click="toggleReplyForm(msg.messageId)"
							class="reply_btn">
							回复
						</button>
					</div>
				</div>

				<!-- 显示回复列表 -->
				<div v-if="msg.replies && msg.replies.length > 0" class="replies">
					<div v-for="reply in msg.replies" :key="reply.id" class="reply_item">
						<span class="nickname">{{ reply.nickname }}</span>
						<span class="time">{{ new Date(reply.timestamp).format('yyyy-MM-dd HH:mm:ss') }}</span>
						<p>{{ reply.content }}</p>
					</div>
				</div>

				<!-- 回复区 -->
				<div v-if="replyingTo === msg.messageId" class="reply_form">
					<el-input
						v-model="replyNickName"
						placeholder="输入你的昵称"
						class="reply_nickName"></el-input>
					<el-input
						type="textarea"
						v-model="replyContent"
						placeholder="输入你的回复..."
						class="reply_textarea"></el-input>
					<el-button @click="addReply(msg.messageId)" :disabled="loading" class="send_btn">
						{{ loading ? '提交中...' : '发送回复' }}
					</el-button>
				</div>
			</div>
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
import { ref } from 'vue';
import {
	getMessageList,
	addMessageFn,
	addReplyFn
} from '@/services/summonerServices/summonerServices.js';
import { ElMessage } from 'element-plus';

// 数据
const nickname = ref('');
const messageContent = ref('');
const replyContent = ref('');
const replyNickName = ref('');
const messages = ref([]);
const replyingTo = ref(null);
const loading = ref(false);

// 获取留言列表
const getMessages = async () => {
	try {
		const response = await getMessageList({ page: 1 });
		console.log('response;;0000', response);
		let { list = [] } = response || {};
		messages.value = list;
	} catch (error) {
		console.error('获取留言失败', error);
	}
};

// 新增留言
const addMessage = async () => {
	if (!nickname.value || !messageContent.value) {
		alert('昵称和留言内容不能为空！');
		return;
	}

	loading.value = true;
	try {
		let props = {
			nickname: nickname.value,
			content: messageContent.value
		};
		addMessageFn(props)
			.then(() => {
				getMessages(); // 刷新留言列表
				nickname.value = '';
				messageContent.value = '';
				ElMessage.success('留言成功！');
			})
			.catch((err) => {
				alert('留言失败，请稍后再试', err);
			});
	} catch (error) {
		console.error('留言失败', error);
		alert('留言失败，请稍后再试');
	} finally {
		loading.value = false;
	}
};

// 新增回复
const addReply = async (messageId) => {
	if (!replyContent.value) {
		alert('回复内容不能为空！');
		return;
	}
	if (!replyNickName.value) {
		alert('回复昵称不能为空！');
		return;
	}

	loading.value = true;
	try {
		let props = {
			messageId,
			nickname: replyNickName.value,
			content: replyContent.value
		};
		addReplyFn(props)
			.then(() => {
				getMessages(); // 刷新留言列表
				replyContent.value = '';
				replyingTo.value = null;
			})
			.catch((err) => {
				alert('回复失败，请稍后再试', err);
			});
	} catch (error) {
		console.error('回复失败', error);
		alert('回复失败，请稍后再试');
	} finally {
		loading.value = false;
	}
};

// 切换显示回复框
const toggleReplyForm = (messageId) => {
	console.log(';=replyingTo===--', messageId);
	replyingTo.value = replyingTo.value === messageId ? null : messageId;
};

// 页面加载时获取留言
getMessages();
</script>
  
<style lang="less">
.message_board {
	max-width: 800px;
	height: 100%;
	margin: 0 auto;
	padding: 0 20px 20px;
	overflow: hidden;
	.message_list {
		margin-top: 20px;
		height: calc(100% - 140px - 20px);
		overflow: auto;
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
	margin-left: 6px;
}
</style>
  