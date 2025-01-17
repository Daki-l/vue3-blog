<template>
    <el-dialog class="reply_message_dialog" :model-value="true" title="回复消息" width="500" @closed="cancelHandler">
        <div class="content_info">
            {{ detailData.content || '-' }}
        </div>
        <div class="content_reply">
            <el-input
                v-model="replyNickName"
                placeholder="输入你的昵称"
                class="reply_nickName"></el-input>
            <el-input
                type="textarea"
                v-model="replyContent"
                placeholder="输入你的回复..."
                class="reply_textarea"></el-input>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="cancelHandler">取消</el-button>
                <el-button type="primary" @click="addReply()" :disabled="onLoading" class="send_btn">{{ onLoading ? '提交中...' : '发送回复' }}</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { reactive, ref, defineProps, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
	addReplyFn,
} from '@/services/summonerServices/summonerServices.js';
const emit = defineEmits(['cancel', 'success']);

const props = defineProps({
    detailData: { type:Object, default: () => { return {}; }}
});
const replyNickName = ref('开发者');
const replyContent = ref('');
const onLoading = ref(false)

onMounted(() => {})

const cancelHandler = () => {
    emit('cancel');
}

// 新增回复
const addReply = async () => {
    let { detailData } = props;
    let messageId = detailData.messageId;
	if (!replyContent.value) {
		alert('回复内容不能为空！');
		return;
	}
	if (!replyNickName.value) {
		alert('回复昵称不能为空！');
		return;
	}

	onLoading.value = true;
	try {
		let props = {
			messageId,
			nickname: replyNickName.value,
			content: replyContent.value
		};
		addReplyFn(props)
			.then(() => {
                ElMessage.success('回复成功！');
				replyContent.value = '';
                emit('success');
			})
			.catch((err) => {
                ElMessage.error('回复失败，请稍后再试!', err);
			});
	} catch (err) {
        ElMessage.error('回复失败，请稍后再试!', err);
	} finally {
		onLoading.value = false;
	}
};


</script>

<style lang="less">
.reply_message_dialog {
    .content_info {
        margin-bottom: 14px;
    }
}
</style>