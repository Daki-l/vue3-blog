<template>
    <el-dialog class="update_coupon_dialog" :model-value="true" title="更新兑换码内容" width="500" @closed="cancelHandler">
        <div class="content_info">
            {{ detailData.content || '-' }}
        </div>
        <div class="content_reply">
            <el-input
                type="textarea"
                v-model="newContent"
                placeholder="输入更改后的内容."
                class="reply_textarea"></el-input>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="cancelHandler">取消</el-button>
                <el-button type="primary" @click="updateMessage()" :disabled="onLoading" class="send_btn">{{ onLoading ? '提交中...' : '修改内容' }}</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { reactive, ref, defineProps, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
    updateSummonerCodeFn
} from '@/services/summonerServices/summonerServices.js';
const emit = defineEmits(['cancel', 'success']);

const props = defineProps({
    detailData: { type:Object, default: () => { return {}; }}
});
const newContent = ref('');
const onLoading = ref(false)

onMounted(() => {
    newContent.value = props?.detailData?.content || '';
})

const cancelHandler = () => {
    emit('cancel');
}

// 更新回复
const updateMessage = async () => {
    let { detailData } = props;
	if (!newContent.value) {
        ElMessage.error('内容不能为空！');
		return;
	}
	onLoading.value = true;
	try {
		let props = Object.assign({}, detailData, { content: newContent.value });
		updateSummonerCodeFn(props)
			.then(() => {
                ElMessage.success('修改成功！');
				newContent.value = '';
                emit('success');
			})
			.catch((err) => {
                ElMessage.error('修改失败，请稍后再试!', err);
			});
	} catch (err) {
        ElMessage.error('修改失败，请稍后再试!', err);
	} finally {
		onLoading.value = false;
	}
};


</script>

<style lang="less">
.update_coupon_dialog {
    .content_info {
        margin-bottom: 14px;
    }
}
</style>