<template>
	<div class="message_board">
		<!-- 发言区(置顶卡片) -->
		<div class="compose_card">
			<div class="compose_identity">
				<div class="avatar" :style="avatarStyle(composeNickname || '游')">{{ avatarChar(composeNickname || '游') }}</div>
				<div class="identity_main">
					<template v-if="userStore.isLogged">
						<div class="identity_name">
							{{ userStore.displayName }}
							<el-tag size="small" :type="userStore.isAdmin ? 'danger' : 'primary'">{{ userStore.isAdmin ? '官方' : '站内' }}</el-tag>
						</div>
					</template>
					<template v-else>
						<div class="guest_row">
							<el-input v-model="composeNickname" class="nick_input" maxlength="20" placeholder="你的昵称">
								<template #append>
									<el-button link @click="useRandomName">随机</el-button>
								</template>
							</el-input>
						</div>
						<div class="guest_tip">游客发布 · 昵称会记住,下次自动填入</div>
					</template>
				</div>
			</div>
			<el-input
				v-model="composeContent"
				type="textarea"
				:rows="3"
				maxlength="500"
				show-word-limit
				resize="none"
				placeholder="说点什么吧…(每小时最多 6 条)" />
			<div class="compose_bar">
				<el-button type="primary" :loading="sending" @click="submitMessage">发布留言</el-button>
			</div>
		</div>

		<!-- 留言卡片流 -->
		<div class="msg_list" v-loading="loading">
			<div class="msg_card" v-for="msg in messageList" :key="msg.id">
				<div class="avatar" :style="avatarStyle(msg.nickname)">{{ avatarChar(msg.nickname) }}</div>
				<div class="msg_main">
					<div class="msg_head">
						<span class="nickname">{{ msg.nickname }}</span>
						<el-tag v-if="msg.badge === 'admin'" size="small" type="danger" effect="plain">官</el-tag>
						<el-tag v-else-if="msg.badge === 'user'" size="small" type="primary" effect="plain">站内</el-tag>
						<span class="floor">#{{ msg.id }}</span>
					</div>
					<div class="msg_content">{{ msg.content }}</div>
					<div class="msg_foot">
						<span class="time" :title="formatDateTime(msg.created_at)">{{ relativeTime(msg.created_at) }}</span>
						<el-button link size="small" @click="openReply(msg, null)">回复</el-button>
					</div>

					<!-- 回复列表 -->
					<div class="reply_list" v-if="(msg.replies || []).length > 0">
						<div class="reply_item" v-for="reply in msg.replies" :key="reply.id">
							<div class="avatar small" :style="avatarStyle(reply.nickname)">{{ avatarChar(reply.nickname) }}</div>
							<div class="reply_main">
								<div class="reply_head">
									<span class="nickname">{{ reply.nickname }}</span>
									<span v-if="targetName(msg, reply)" class="reply_at">@{{ targetName(msg, reply) }}</span>
									<span class="time" :title="formatDateTime(reply.created_at)">{{ relativeTime(reply.created_at) }}</span>
									<el-button link size="small" class="reply_btn_inline" @click="openReply(msg, reply)">回复</el-button>
								</div>
								<div class="reply_content">{{ reply.content }}</div>
							</div>
						</div>
					</div>

					<!-- 回复输入框(展开式) -->
					<div class="reply_box" v-if="replyingTo && replyingTo.messageId === msg.id">
						<div class="reply_box_tip" v-if="replyingTo.reply">
							回复 @{{ replyingTo.reply.nickname }}:
						</div>
						<el-input
							v-if="!userStore.isLogged"
							v-model="replyNickname"
							class="reply_nick"
							size="small"
							maxlength="20"
							placeholder="你的昵称" />
						<el-input
							v-model="replyContent"
							type="textarea"
							size="small"
							:rows="2"
							maxlength="500"
							resize="none"
							placeholder="回复内容…" />
						<div class="reply_box_bar">
							<el-button size="small" @click="closeReply">取消</el-button>
							<el-button size="small" type="primary" :loading="sending" @click="submitReply(msg)">发送回复</el-button>
						</div>
					</div>
				</div>
			</div>
			<el-empty v-if="!loading && messageList.length === 0" description="还没有留言,来抢一楼" :image-size="90" />
			<div class="load_more" v-if="hasMore">
				<el-button :loading="loading" @click="loadMore">加载更多</el-button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getMessages, addMessage, addReply } from '@/services/message';
import { useUserStore } from '@/stores/user';
import { formatDateTime } from '@/utils/format';

const userStore = useUserStore();

const messageList = ref([]);
const page = ref(1);
const pageSize = 15;
const total = ref(0);
const loading = ref(false);
const sending = ref(false);

// ===== 发言区 =====
const NICK_KEY = 'ln_guest_nickname';
const composeNickname = ref(localStorage.getItem(NICK_KEY) || '');
const composeContent = ref('');

const RANDOM_PREFIX = ['旅行的', '路过的', '沉默的', '神秘的', '漂泊的', '热血的', '悠闲的'];
const RANDOM_SUFFIX = ['召唤师', '冒险家', '魔法师', '侠客', '旅人', '武者', '贤者'];
const useRandomName = () => {
	const p = RANDOM_PREFIX[Math.floor(Math.random() * RANDOM_PREFIX.length)];
	const s = RANDOM_SUFFIX[Math.floor(Math.random() * RANDOM_SUFFIX.length)];
	const n = Math.floor(1000 + Math.random() * 9000);
	composeNickname.value = `${p}${s}${n}`;
};

const hasMore = computed(() => messageList.value.length < total.value);

const initList = async () => {
	loading.value = true;
	try {
		const res = await getMessages({ page: 1, pageSize });
		messageList.value = res?.list || [];
		total.value = Number(res?.total) || 0;
		page.value = 1;
	} catch (e) {
		console.error('获取留言失败', e);
	} finally {
		loading.value = false;
	}
};

const loadMore = async () => {
	loading.value = true;
	try {
		const res = await getMessages({ page: page.value + 1, pageSize });
		messageList.value = messageList.value.concat(res?.list || []);
		total.value = Number(res?.total) || 0;
		page.value += 1;
	} catch (e) {
		console.error('加载更多失败', e);
	} finally {
		loading.value = false;
	}
};

const submitMessage = async () => {
	const nickname = userStore.isLogged ? userStore.displayName : composeNickname.value.trim();
	if (!nickname) {
		ElMessage.warning('请先填写昵称(或点"随机")');
		return;
	}
	if (!composeContent.value.trim()) {
		ElMessage.warning('留言内容不能为空');
		return;
	}
	sending.value = true;
	try {
		await addMessage({ nickname, content: composeContent.value.trim() });
		if (!userStore.isLogged) {
			localStorage.setItem(NICK_KEY, nickname); // 游客昵称记忆
		}
		composeContent.value = '';
		ElMessage.success('留言成功!');
		initList();
	} catch (e) {
		// 错误提示由拦截器统一处理
	} finally {
		sending.value = false;
	}
};

// ===== 回复(支持 @ 指定回复) =====
const replyingTo = ref(null); // { messageId, reply }
const replyNickname = ref('');
const replyContent = ref('');

const openReply = (msg, reply) => {
	replyingTo.value = { messageId: msg.id, reply };
	if (!userStore.isLogged) {
		replyNickname.value = composeNickname.value || localStorage.getItem(NICK_KEY) || '';
	}
};

const closeReply = () => {
	replyingTo.value = null;
	replyContent.value = '';
};

const submitReply = async (msg) => {
	const nickname = userStore.isLogged ? userStore.displayName : replyNickname.value.trim();
	if (!nickname) {
		ElMessage.warning('请先填写昵称');
		return;
	}
	if (!replyContent.value.trim()) {
		ElMessage.warning('回复内容不能为空');
		return;
	}
	sending.value = true;
	try {
		const payload = { nickname, content: replyContent.value.trim() };
		if (replyingTo.value?.reply) {
			payload.targetReplyId = replyingTo.value.reply.id;
		}
		await addReply(msg.id, payload);
		if (!userStore.isLogged) {
			localStorage.setItem(NICK_KEY, nickname);
			composeNickname.value = nickname;
		}
		closeReply();
		ElMessage.success('回复成功!');
		initList();
	} catch (e) {
		// 拦截器统一提示
	} finally {
		sending.value = false;
	}
};

// 回复 @ 目标昵称(在同一条留言的 replies 里查)
const targetName = (msg, reply) => {
	if (!reply.targetReplyId) return '';
	const target = (msg.replies || []).find((r) => r.id === reply.targetReplyId);
	return target ? target.nickname : '';
};

// ===== 视觉工具:首字头像 + 昵称哈希取色 =====
const PALETTE = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#9b59b6', '#16a085', '#d35400', '#2c82c9'];
const hashIndex = (name) => {
	let h = 0;
	for (let i = 0; i < String(name).length; i++) {
		h = (h * 31 + String(name).charCodeAt(i)) >>> 0;
	}
	return h % PALETTE.length;
};
const avatarStyle = (name) => ({ background: PALETTE[hashIndex(name)] });
const avatarChar = (name) => {
	const s = String(name || '游').trim();
	return s.slice(0, 1).toUpperCase();
};

// 相对时间(库内时间为 UTC)
const relativeTime = (value) => {
	if (!value) return '';
	const str = String(value).replace('T', ' ').replace('Z', '').replace(/\.\d+/, '');
	const t = new Date(`${str}Z`).getTime();
	if (isNaN(t)) return value;
	const diff = Date.now() - t;
	const m = Math.floor(diff / 60000);
	if (m < 1) return '刚刚';
	if (m < 60) return `${m} 分钟前`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h} 小时前`;
	const d = Math.floor(h / 24);
	if (d === 1) return '昨天';
	if (d < 30) return `${d} 天前`;
	return formatDateTime(value).slice(0, 10);
};

onMounted(() => {
	initList();
});
</script>

<style lang="less">
.message_board {
	max-width: 860px;
	margin: 0 auto;
	padding: 16px 16px 24px;

	.compose_card {
		background: #ffffff;
		border-radius: 10px;
		padding: 14px 16px;
		margin-bottom: 16px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);
		.compose_identity {
			display: flex;
			gap: 10px;
			margin-bottom: 10px;
			.identity_main {
				flex: 1;
				min-width: 0;
			}
			.identity_name {
				font-size: 14px;
				font-weight: 600;
				color: #303133;
				display: flex;
				align-items: center;
				gap: 6px;
				line-height: 34px;
			}
			.guest_row {
				max-width: 280px;
			}
			.guest_tip {
				font-size: 12px;
				color: #909399;
				margin-top: 2px;
			}
		}
		.compose_bar {
			display: flex;
			justify-content: flex-end;
			margin-top: 10px;
		}
	}

	.avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		color: #ffffff;
		font-size: 16px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		user-select: none;
		&.small {
			width: 26px;
			height: 26px;
			font-size: 12px;
		}
	}

	.msg_list {
		min-height: 200px;
	}

	.msg_card {
		display: flex;
		gap: 12px;
		background: #ffffff;
		border-radius: 10px;
		padding: 14px 16px;
		margin-bottom: 12px;
		box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);

		.msg_main {
			flex: 1;
			min-width: 0;
		}
		.msg_head {
			display: flex;
			align-items: center;
			gap: 8px;
			flex-wrap: wrap;
			.nickname {
				font-size: 14px;
				font-weight: 600;
				color: #303133;
			}
			.floor {
				margin-left: auto;
				font-size: 12px;
				color: #c0c4cc;
			}
		}
		.msg_content {
			font-size: 14px;
			color: #303133;
			line-height: 1.7;
			margin: 6px 0 8px;
			word-break: break-word;
			white-space: pre-wrap;
		}
		.msg_foot {
			display: flex;
			align-items: center;
			gap: 14px;
			.time {
				font-size: 12px;
				color: #909399;
				cursor: default;
			}
		}

		.reply_list {
			margin-top: 10px;
			background: #f8f9fb;
			border-radius: 8px;
			padding: 10px 12px;
			.reply_item {
				display: flex;
				gap: 8px;
				padding: 6px 0;
				& + .reply_item {
					border-top: 1px dashed #ebeef5;
				}
				.reply_main {
					flex: 1;
					min-width: 0;
				}
				.reply_head {
					display: flex;
					align-items: center;
					gap: 8px;
					flex-wrap: wrap;
					.nickname {
						font-size: 13px;
						font-weight: 600;
						color: #303133;
					}
					.reply_at {
						font-size: 12px;
						color: #409eff;
					}
					.time {
						font-size: 12px;
						color: #c0c4cc;
						cursor: default;
					}
					.reply_btn_inline {
						font-size: 12px;
						padding: 0;
						height: auto;
					}
				}
				.reply_content {
					font-size: 13px;
					color: #606266;
					line-height: 1.6;
					word-break: break-word;
					white-space: pre-wrap;
				}
			}
		}

		.reply_box {
			margin-top: 10px;
			display: flex;
			flex-direction: column;
			gap: 8px;
			background: #f8f9fb;
			border-radius: 8px;
			padding: 10px 12px;
			.reply_box_tip {
				font-size: 13px;
				color: #409eff;
			}
			.reply_nick {
				max-width: 240px;
			}
			.reply_box_bar {
				display: flex;
				justify-content: flex-end;
				gap: 8px;
			}
		}
	}

	.load_more {
		display: flex;
		justify-content: center;
		margin-top: 6px;
	}

	@media (max-width: 768px) {
		padding: 12px 10px 20px;
		.msg_card,
		.compose_card {
			padding: 12px;
		}
		.floor {
			display: none;
		}
	}
}
</style>
