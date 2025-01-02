<template>
	<div class="article-detail" v-loading="detailLoading">
		<!-- 顶部封面图片 -->
		<el-image
			v-if="article.cover?.path"
			:src="article.cover?.path"
			fit="cover"
			class="article-cover"
			alt="Article Cover"></el-image>

		<!-- 文章内容 -->
		<el-card shadow="hover" class="article-content">
			<h2 class="title">{{ article.title }}</h2>
			<h4 class="subtitle">{{ article.subTitle }}</h4>
			<div class="tags">
				<el-tag v-for="(tag, index) in tagsArray" :key="index" class="tag">{{ tag }}</el-tag>
			</div>
			<p class="intro">{{ article.intro }}</p>
			<div v-html="markdownContent" class="content"></div>
		</el-card>

		<!-- 留言和回复 -->
		<!-- <comment-section :articleId="article.id" /> -->
	</div>
</template>
  
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, onBeforeRouteUpdate } from 'vue-router';
// import CommentSection from '@/components/CommentSection.vue';
import { getArticleDetailById } from '@/services/articleService';
import { ElMessage } from 'element-plus';
import { marked } from 'marked';

const article = ref({
	id: 0,
	title: '',
	subTitle: '',
	cover: null,
	tags: '',
	intro: '',
	content: ''
});
const tagsArray = ref([]);
const detailLoading = ref(false);
const route = useRoute();
// const defaultCover = 'https://via.placeholder.com/1920x1200?text=No+Image';

const fetchArticleDetail = async () => {
	let { id } = route?.query || {};
	if (!id) {
		return;
	}
	try {
		detailLoading.value = true;
		const response = await getArticleDetailById(id); // 假设文章 ID 为 4
		// response.content = marked(response.content);
		article.value = response;
		tagsArray.value = response.tags.split(',').filter((tag) => tag.trim());
		detailLoading.value = false;
	} catch (error) {
		console.error('Failed to fetch article detail:', error);
		ElMessage.error(error);
		detailLoading.value = false;
	}
};

const markdownContent = computed(() => marked(article.value.content || ''));

onMounted(fetchArticleDetail);

watch(
	() => route.query,
	(newQuery, oldQuery) => {
		if (newQuery.id !== oldQuery.id) {
			fetchArticleDetail();
		}
	}
);
</script>
  
  <style scoped>
.article-detail {
	padding: 20px;
	min-height: 100%;
}

.article-cover {
	width: 100%;
	height: 300px;
	border-radius: 8px;
	object-fit: cover;
	background-color: #f0f0f0;
}

.image-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 300px;
	font-size: 20px;
	color: #aaa;
	background-color: #ddd;
}

.article-content {
	margin-top: 20px;
}

.title {
	font-size: 24px;
	font-weight: bold;
}

.subtitle {
	font-size: 18px;
	color: #666;
}

.tags {
	margin: 10px 0;
}

.tag {
	margin-right: 5px;
}

.intro {
	font-size: 16px;
	color: #333;
}

.content {
	margin-top: 20px;
	line-height: 1.8;
}
</style>
  