<template>
	<div class="article_detail">
		<div class="arctile_topInfo" v-loading="detailLoading">
			<div class="arctile_title">{{ detailInfo.title }}</div>
			<div class="arctile_base_info">
				<span class="create_time">创建日期：{{ new Date(detailInfo.createDate).format() }}</span>
				<span class="create_time">更新日期：{{ new Date(detailInfo.updateDate).format() }}</span>
			</div>
		</div>
	</div>
</template>

<script setup>
import { getArticleDetailById } from '@/services/articleService';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

const detailInfo = ref({});
const detailLoading = ref(false);
onMounted(() => {
	initDetailInfo();
});

const initDetailInfo = () => {
	const route = useRoute();
	let { id } = route?.query || {};
	detailLoading.value = true;
	getArticleDetailById(id)
		.then((res) => {
			detailInfo.value = res || {};
		})
		.catch((error) => {
			ElMessage.error(error);
		})
		.finally(() => {
			detailLoading.value = false;
		});
};
</script>

<style lang="less">
.article_detail {
	.arctile_title {
	}
}
</style>