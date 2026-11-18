<template>
	<div class="notice_detail" v-loading="onLoading">
		<div class="notice_content" v-html="noticeDetail && noticeDetail.content"></div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useNoticeStore } from '@/stores/notice.js';
import { useRoute, useRouter } from 'vue-router';
import { getNoticeDetail } from '@/services/notice';

let route = useRoute();
let router = useRouter();
const noticeStore = useNoticeStore();
const noticeDetail = ref({});
const onLoading = ref(false);

const gotoList = () => {
	// 无缓存数据时跳回列表页
	router.replace({ name: 'noticeList' });
};

const fetchDetail = async (id) => {
	onLoading.value = true;
	try {
		const res = await getNoticeDetail(id);
		if (res?.content) {
			noticeDetail.value = res;
			noticeStore.noticeDetail = res;
		} else {
			gotoList();
		}
	} catch (e) {
		gotoList();
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
		gotoList();
	}
});
</script>

<style lang="less">
.notice_detail {
	background-color: #ffffff;
	padding: 10px 24px;
	height: 100%;
	img {
		width: 100%;
	}
}
</style>
