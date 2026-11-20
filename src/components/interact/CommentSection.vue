<template>
	<div class="comment_section">
		<div class="cs_title">{{ t('comment.title') }} <span class="cs_count" v-if="total">{{ total }}</span></div>

		<!-- 发表框(登录制;评论内容原样展示,不翻译) -->
		<div class="cs_box" v-if="isLogged">
			<el-input
				v-model="draft"
				type="textarea"
				:rows="2"
				maxlength="500"
				show-word-limit
				:placeholder="t('comment.placeholder')" />
			<div class="cs_box_foot">
				<el-button type="primary" size="small" :loading="posting" :disabled="!draft.trim()" @click="submit">
					{{ t('comment.submit') }}
				</el-button>
			</div>
		</div>
		<div class="cs_login_hint" v-else>
			<el-button link type="primary" @click="goLogin">{{ t('comment.loginToPost') }}</el-button>
		</div>

		<!-- 列表 -->
		<div v-if="list.length" class="cs_list">
			<div v-for="c in list" :key="c.id" class="cs_item">
				<div class="cs_head">
					<span class="cs_nick" :class="{ admin: c.badge === 'admin' }">{{ c.nickname }}</span>
					<span class="cs_time">{{ c.created_at?.slice(0, 16).replace('T', ' ') }}</span>
				</div>
				<div class="cs_content">{{ c.content }}</div>

				<!-- 回复 -->
				<div v-if="c.replies?.length" class="cs_replies">
					<div v-for="r in c.replies" :key="r.id" class="cs_reply">
						<span class="cs_nick" :class="{ admin: r.badge === 'admin' }">{{ r.nickname }}</span>
						<span class="cs_reply_to" v-if="r.targetReplyId">@{{ nickOf(c.replies, r.targetReplyId) }}</span>
						<span class="cs_content inline">{{ r.content }}</span>
					</div>
				</div>
				<div class="cs_actions">
					<el-button v-if="isLogged" link size="small" @click="replyTo = replyTo === c.id ? null : c.id">
						{{ t('comment.reply') }}
					</el-button>
				</div>
				<div v-if="replyTo === c.id" class="cs_reply_box">
					<el-input v-model="replyDraft[c.id]" size="small" maxlength="500" :placeholder="t('comment.replyPlaceholder')" />
					<el-button type="primary" size="small" :disabled="!(replyDraft[c.id] || '').trim()" @click="submitReply(c.id)">
						{{ t('comment.submit') }}
					</el-button>
				</div>
			</div>
			<div class="cs_more" v-if="list.length < total">
				<el-button link @click="load">{{ t('comment.more') }}</el-button>
			</div>
		</div>
		<div v-else class="cs_empty">{{ t('comment.empty') }}</div>
	</div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getComments, addComment, addReply } from '@/services/interact3mdc';
import { useUserStore } from '@/stores/user';
import { t } from '@/common/i18n';

const props = defineProps({
	targetType: { type: String, required: true },
	targetId: { type: [Number, String], required: true }
});

const router = useRouter();
const userStore = useUserStore();
const isLogged = userStore.isLogged;

const list = ref([]);
const total = ref(0);
const page = ref(1);
const draft = ref('');
const posting = ref(false);
const replyTo = ref(null);
const replyDraft = ref({});

const goLogin = () => router.push({ path: '/login', query: { redirect: location.pathname + location.search } });
const nickOf = (replies, id) => replies.find((r) => r.id === id)?.nickname ?? '?';

async function load(reset = false) {
	if (reset) { page.value = 1; list.value = []; }
	try {
		const r = await getComments(props.targetType, props.targetId, page.value);
		list.value = reset ? (r.list ?? []) : [...list.value, ...(r.list ?? [])];
		total.value = r.total ?? list.value.length;
	} catch { /* 目标暂无评论服务时静默 */ }
}

async function submit() {
	if (!draft.value.trim()) return;
	posting.value = true;
	try {
		await addComment(props.targetType, props.targetId, draft.value.trim());
		draft.value = '';
		await load(true);
	} catch (e) {
		console.error(e);
	} finally {
		posting.value = false;
	}
}

async function submitReply(commentId) {
	const text = (replyDraft.value[commentId] || '').trim();
	if (!text) return;
	try {
		await addReply(commentId, text);
		replyDraft.value[commentId] = '';
		replyTo.value = null;
		await load(true);
	} catch (e) {
		console.error(e);
	}
}

watch(() => [props.targetType, props.targetId], () => load(true));
onMounted(() => load(true));
</script>

<style lang="less">
.comment_section {
	background: #ffffff;
	border-radius: 10px;
	padding: 14px 16px;
	box-shadow: 0 1px 4px rgba(31, 45, 61, 0.06);

	.cs_title {
		font-size: 15px;
		font-weight: 600;
		color: #303133;
		margin-bottom: 10px;
		.cs_count {
			font-size: 12px;
			color: #909399;
			margin-left: 4px;
		}
	}
	.cs_box_foot {
		margin-top: 6px;
		text-align: right;
	}
	.cs_login_hint {
		padding: 6px 0 2px;
	}
	.cs_item {
		padding: 10px 0;
		border-bottom: 1px dashed #ebeef5;
		&:last-of-type { border-bottom: none; }
	}
	.cs_head {
		display: flex;
		align-items: center;
		gap: 8px;
		.cs_nick {
			font-size: 13px;
			font-weight: 600;
			color: #409eff;
			&.admin { color: #e6a23c; }
		}
		.cs_time {
			font-size: 11px;
			color: #c0c4cc;
		}
	}
	.cs_content {
		margin-top: 4px;
		font-size: 13px;
		color: #303133;
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
		&.inline { display: inline; margin: 0; }
	}
	.cs_replies {
		margin-top: 6px;
		padding-left: 10px;
		border-left: 2px solid #ebeef5;
		.cs_reply {
			padding: 3px 0;
			font-size: 12px;
			.cs_nick { color: #409eff; font-weight: 600; }
			.cs_reply_to { color: #909399; margin: 0 4px; }
		}
	}
	.cs_actions {
		margin-top: 2px;
	}
	.cs_reply_box {
		margin-top: 6px;
		display: flex;
		gap: 8px;
	}
	.cs_more {
		text-align: center;
		margin-top: 8px;
	}
	.cs_empty {
		color: #c0c4cc;
		font-size: 12px;
		text-align: center;
		padding: 14px 0 6px;
	}
}
</style>
