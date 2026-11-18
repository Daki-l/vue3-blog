<template>
	<div class="admin_articles_wrapper">
		<div class="page_header">
			<span class="page_title">文章管理</span>
			<div class="header_btns">
				<el-button link type="primary" :loading="listLoading" @click="initArticleList">刷新</el-button>
				<el-button type="primary" @click="openEditor(null)">新建文章</el-button>
			</div>
		</div>
		<el-table :data="articleList" border style="width: 100%" v-loading="listLoading">
			<el-table-column prop="id" label="ID" width="70" sortable />
			<el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
			<el-table-column prop="subtitle" label="副标题" min-width="140" show-overflow-tooltip>
				<template #default="{ row }">{{ row.subtitle ?? row.sub_title ?? '-' }}</template>
			</el-table-column>
			<el-table-column prop="tags" label="标签" width="140" show-overflow-tooltip>
				<template #default="{ row }">{{ row.tags || '-' }}</template>
			</el-table-column>
			<el-table-column label="发布日期" width="120">
				<template #default="{ row }">{{ row.pub_date || row.created_at?.slice(0, 10) || '-' }}</template>
			</el-table-column>
			<el-table-column label="状态" width="90">
				<template #default="{ row }">
					<el-tag :type="Number(row.status) === 1 ? 'success' : 'info'">
						{{ Number(row.status) === 1 ? '显示' : '隐藏' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="操作" width="140" align="right">
				<template #default="{ row }">
					<el-button type="primary" link @click="openEditor(row)">编辑</el-button>
					<el-popconfirm title="确认删除该文章？" @confirm="handleDelete(row)">
						<template #reference>
							<el-button type="danger" link>删除</el-button>
						</template>
					</el-popconfirm>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无文章" :image-size="80" />
			</template>
		</el-table>
		<div class="pagination_box" v-if="total > pageSize">
			<el-pagination
				background
				layout="total, prev, pager, next"
				:total="total"
				:page-size="pageSize"
				:current-page="page"
				@current-change="handlePageChange" />
		</div>

		<!-- 新建/编辑弹窗 -->
		<el-dialog
			v-model="editorVisible"
			:title="editingId ? '编辑文章' : '新建文章'"
			width="860"
			top="4vh"
			:close-on-click-modal="false">
			<el-form :model="form" label-width="90px" class="article_form">
				<el-row :gutter="12">
					<el-col :span="12">
						<el-form-item label="标题" required>
							<el-input v-model="form.title" maxlength="100" placeholder="文章标题" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="副标题">
							<el-input v-model="form.sub_title" maxlength="100" placeholder="副标题(选填)" />
						</el-form-item>
					</el-col>
				</el-row>
				<el-row :gutter="12">
					<el-col :span="12">
						<el-form-item label="标签">
							<el-input v-model="form.tags" placeholder="多个标签用英文逗号分隔(选填)" />
						</el-form-item>
					</el-col>
					<el-col :span="6">
						<el-form-item label="发布日期">
							<el-date-picker
								v-model="form.pub_date"
								type="date"
								value-format="YYYY-MM-DD"
								placeholder="选填"
								class="full_width" />
						</el-form-item>
					</el-col>
					<el-col :span="6">
						<el-form-item label="显示">
							<el-switch
								v-model="form.status"
								:active-value="1"
								:inactive-value="0"
								active-text="显示"
								inactive-text="隐藏" />
						</el-form-item>
					</el-col>
				</el-row>
				<el-form-item label="简介">
					<el-input v-model="form.intro" type="textarea" :rows="2" placeholder="简介(选填)" />
				</el-form-item>
				<el-form-item label="封面URL">
					<el-input v-model="form.cover_url" placeholder="封面图片完整 URL(选填)" />
				</el-form-item>
				<el-form-item label="正文">
					<el-tabs v-model="contentTab" class="content_tabs">
						<el-tab-pane label="Markdown 编辑" name="edit">
							<el-input
								v-model="form.content_md"
								type="textarea"
								:rows="14"
								placeholder="输入 Markdown 正文"
								class="md_textarea" />
						</el-tab-pane>
						<el-tab-pane label="预览" name="preview">
							<div class="md_preview" v-html="previewHtml"></div>
						</el-tab-pane>
					</el-tabs>
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="editorVisible = false">取消</el-button>
				<el-button type="primary" :loading="saving" @click="submitArticle">
					{{ editingId ? '保存修改' : '创建' }}
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { marked } from 'marked';
import { getAdminArticles, getAdminArticleDetail, createArticle, updateArticle, deleteArticle } from '@/services/admin';

const articleList = ref([]);
const listLoading = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const editorVisible = ref(false);
const saving = ref(false);
const editingId = ref(null);
const contentTab = ref('edit');

const form = reactive({
	title: '',
	sub_title: '',
	tags: '',
	intro: '',
	cover_url: '',
	status: 1,
	pub_date: '',
	content_md: ''
});

const previewHtml = computed(() => marked(form.content_md || ''));

const initArticleList = async () => {
	listLoading.value = true;
	try {
		const res = await getAdminArticles({ page: page.value, pageSize: pageSize.value });
		articleList.value = res?.list || [];
		total.value = Number(res?.total) || articleList.value.length;
	} catch (e) {
		console.error('获取文章列表失败', e);
	} finally {
		listLoading.value = false;
	}
};

const handlePageChange = (newPage) => {
	page.value = newPage;
	initArticleList();
};

const resetForm = () => {
	form.title = '';
	form.sub_title = '';
	form.tags = '';
	form.intro = '';
	form.cover_url = '';
	form.status = 1;
	form.pub_date = '';
	form.content_md = '';
};

const openEditor = async (row) => {
	editingId.value = row ? row.id : null;
	contentTab.value = 'edit';
	resetForm();
	if (row) {
		// 编辑:拉取详情拿完整正文
		try {
			listLoading.value = true;
			const detail = await getAdminArticleDetail(row.id);
			const article = detail?.article || detail;
			form.title = article?.title || '';
			form.sub_title = article?.sub_title ?? article?.subtitle ?? '';
			form.tags = article?.tags || '';
			form.intro = article?.intro || '';
			form.cover_url = article?.cover_url || '';
			form.status = Number(article?.status ?? 1) === 1 ? 1 : 0;
			form.pub_date = (article?.pub_date || '').slice(0, 10) || '';
			form.content_md = article?.content_md ?? article?.content ?? '';
		} catch (e) {
			console.error('获取文章详情失败', e);
			return;
		} finally {
			listLoading.value = false;
		}
	}
	editorVisible.value = true;
};

const submitArticle = async () => {
	if (!form.title.trim()) {
		ElMessage.warning('请输入标题');
		return;
	}
	if (!form.content_md.trim()) {
		ElMessage.warning('请输入正文内容');
		return;
	}
	const payload = {
		title: form.title.trim(),
		sub_title: form.sub_title.trim() || undefined,
		tags: form.tags.trim() || undefined,
		intro: form.intro.trim() || undefined,
		cover_url: form.cover_url.trim() || undefined,
		status: form.status,
		pub_date: form.pub_date || undefined,
		content_md: form.content_md
	};
	saving.value = true;
	try {
		if (editingId.value) {
			await updateArticle(editingId.value, payload);
			ElMessage.success('修改成功！');
		} else {
			await createArticle(payload);
			ElMessage.success('创建成功！');
		}
		editorVisible.value = false;
		initArticleList();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	} finally {
		saving.value = false;
	}
};

const handleDelete = async (row) => {
	try {
		await deleteArticle(row.id);
		ElMessage.success('删除成功！');
		initArticleList();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	}
};

onMounted(() => {
	initArticleList();
});
</script>

<style lang="less">
.admin_articles_wrapper {
	.page_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
		.page_title {
			font-size: 18px;
			font-weight: 600;
		}
		.header_btns {
			display: flex;
			gap: 8px;
		}
	}
	.pagination_box {
		display: flex;
		justify-content: center;
		margin-top: 12px;
	}
	.article_form {
		.full_width {
			width: 100%;
		}
		.content_tabs {
			width: 100%;
			.md_textarea {
				font-family: Consolas, Monaco, monospace;
				font-size: 13px;
			}
			.md_preview {
				min-height: 320px;
				max-height: 420px;
				overflow: auto;
				border: 1px solid #e6e8eb;
				border-radius: 4px;
				padding: 12px 16px;
				line-height: 1.7;
				img {
					max-width: 100%;
				}
			}
		}
	}
}
</style>
