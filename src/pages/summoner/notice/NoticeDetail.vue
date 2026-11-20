<template>
	<div class="notice_detail" v-loading="onLoading">
		<div class="detail_header">
			<el-button link @click="goBack">
				<span class="back_arrow">←</span> {{ t('common.back') }}
			</el-button>
			<span class="detail_title">{{ noticeDetail?.title || t('notice.detail') }}</span>
		</div>
		<div class="notice_content" v-html="noticeDetail && noticeDetail.content"></div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { t } from '@/common/i18n';
import { useNoticeStore } from '@/stores/notice.js';
import { useRoute, useRouter } from 'vue-router';
import { getNoticeDetail } from '@/services/notice';

let route = useRoute();
let router = useRouter();
const noticeStore = useNoticeStore();
const noticeDetail = ref({});
const onLoading = ref(false);

const goBack = () => {
	// 有浏览历史回上一页,否则回首页
	if (window.history.state && window.history.state.back) {
		router.back();
	} else {
		router.push('/home');
	}
};

const fetchDetail = async (id) => {
	onLoading.value = true;
	try {
		const res = await getNoticeDetail(id);
		if (res?.content) {
			noticeDetail.value = res;
			noticeStore.noticeDetail = res;
		} else {
			goBack();
		}
	} catch (e) {
		goBack();
	} finally {
		onLoading.value = false;
	}
};

onMounted(() => {
	if (noticeStore.noticeDetail?.content) {
		noticeDetail.value = noticeStore.noticeDetail;
		return;
	}
	// 无缓存:尝试按 id 拉取详情
	let id = route.query.id;
	if (id) {
		fetchDetail(id);
	} else {
		goBack();
	}
});
</script>

<style lang="less">
.notice_detail {
	background-color: #ffffff;
	padding: 10px 24px 24px;
	height: 100%;
	.detail_header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-bottom: 8px;
		margin-bottom: 8px;
		border-bottom: solid 1px #ebeef5;
		.back_arrow {
			font-size: 15px;
		}
		.detail_title {
			flex: 1;
			font-size: 15px;
			font-weight: 600;
			color: #303133;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}
	img {
		width: 100%;
	}
	.notice_content {
		// 富文本内容中的宽表格等不撑破容器
		overflow-x: auto;
		img {
			max-width: 100%;
		}
	}
	// 手机 web:内边距压缩
	@media (max-width: 768px) {
		padding: 10px 12px 16px;
	}
}
</style>
