<template>
	<div class="article-detail" v-loading="detailLoading">
		<div class="detail_header">
			<el-button link @click="goBack">
				<span class="back_arrow">←</span> {{ t('common.back') }}
			</el-button>
			<span class="detail_title">{{ article.title || t('article.detail') }}</span>
		</div>
		<!-- 顶部封面图片(接口返回完整 URL) -->
		<el-image
			v-if="coverUrl"
			:src="coverUrl"
			fit="cover"
			class="article-cover"
			alt="Article Cover"></el-image>

		<!-- 文章内容 -->
		<el-card shadow="hover" class="article-content">
			<h2 class="title">{{ article.title }}</h2>
			<h4 class="subtitle">{{ subtitle }}</h4>
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
import { t } from '@/common/i18n';
import { useRoute, useRouter } from 'vue-router';
// import CommentSection from '@/components/CommentSection.vue';
import { getArticleDetail } from '@/services/article';
import { ElMessage } from 'element-plus';
import { marked } from 'marked';

const goBack = () => {
	// 有浏览历史回上一页,否则回首页
	if (window.history.state && window.history.state.back) {
		router.back();
	} else {
		router.push('/home');
	}
};

const article = ref({
	id: 0,
	title: '',
	subtitle: '',
	cover_url: '',
	tags: '',
	intro: '',
	content: ''
});
const tagsArray = ref([]);
const detailLoading = ref(false);
const route = useRoute();
const router = useRouter();

// snake_case 字段适配(兼容旧字段)
const subtitle = computed(() => article.value.subtitle ?? article.value.subTitle ?? '');
const coverUrl = computed(() => article.value.cover_url || article.value.cover?.path || '');

const fetchArticleDetail = async () => {
	let { id } = route?.query || {};
	if (!id) {
		return;
	}
	try {
		detailLoading.value = true;
		const response = await getArticleDetail(id);
		article.value = response || {};
		tagsArray.value = String(response?.tags || '')
			.split(',')
			.filter((tag) => tag.trim());
	} catch (error) {
		console.error('Failed to fetch article detail:', error);
		ElMessage.error('获取文章详情失败');
	} finally {
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

	.detail_header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding-bottom: 8px;
		margin-bottom: 12px;
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
