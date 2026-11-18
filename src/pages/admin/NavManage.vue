<template>
	<div class="admin_nav_wrapper">
		<div class="page_header">
			<span class="page_title">导航管理</span>
			<div class="header_btns">
				<el-button link type="primary" :loading="listLoading" @click="initNavList">刷新</el-button>
				<el-button type="primary" @click="openEditor(null)">新增导航项</el-button>
			</div>
		</div>
		<el-table :data="displayRows" border style="width: 100%" v-loading="listLoading" row-key="key">
			<el-table-column prop="name" label="名称" min-width="200">
				<template #default="{ row }">
					<span :class="{ child_name: row.depth === 1 }">{{ row.prefix }}{{ row.name }}</span>
				</template>
			</el-table-column>
			<el-table-column prop="path" label="路径" min-width="220">
				<template #default="{ row }">{{ row.path || '(分组,无路径)' }}</template>
			</el-table-column>
			<el-table-column prop="sort" label="排序" width="80" sortable />
			<el-table-column label="显示" width="110">
				<template #default="{ row }">
					<el-tag v-if="row.inheritHidden" type="warning">随父隐藏</el-tag>
					<el-tag v-else :type="row.visible === 1 ? 'success' : 'info'">
						{{ row.visible === 1 ? '显示' : '隐藏' }}
					</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="操作" width="140" align="right">
				<template #default="{ row }">
					<el-button type="primary" link @click="openEditor(row)">编辑</el-button>
					<el-popconfirm
						:title="deleteTip(row)"
						width="240"
						@confirm="handleDelete(row)">
						<template #reference>
							<el-button type="danger" link>删除</el-button>
						</template>
					</el-popconfirm>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无导航项" :image-size="80" />
			</template>
		</el-table>

		<!-- 新增/编辑弹窗 -->
		<el-dialog
			v-model="editorVisible"
			:title="editingId ? '编辑导航项' : '新增导航项'"
			width="520">
			<el-form :model="form" label-width="90px">
				<el-form-item label="关联文章">
					<el-select
						v-model="form.articleId"
						class="full_width"
						clearable
						filterable
						placeholder="选择文章,自动填充名称与路径"
						:loading="articleLoading"
						@change="onArticleChange">
						<el-option
							v-for="a in articleOptions"
							:key="a.id"
							:label="articleLabel(a)"
							:value="a.id" />
					</el-select>
					<div class="form_tip">选择后自动填入名称与路径(/info/scene?id=x),选中后仍可手改</div>
				</el-form-item>
				<el-form-item label="名称" required>
					<el-input v-model="form.name" maxlength="20" placeholder="导航项名称" />
				</el-form-item>
				<el-form-item label="路径">
					<el-input v-model="form.path" placeholder="如 /home 或 /info/scene?id=11,父级分组可留空" />
				</el-form-item>
				<el-form-item label="父级">
					<el-select v-model="form.parentId" placeholder="无(作为顶级)" class="full_width" clearable>
						<el-option
							v-for="root in parentOptions"
							:key="root.id"
							:label="root.name"
							:value="root.id" />
					</el-select>
				</el-form-item>
				<el-form-item label="排序">
					<el-input-number v-model="form.sort" :min="0" :max="999" />
				</el-form-item>
				<el-form-item label="显示">
					<el-switch v-model="form.visible" :active-value="1" :inactive-value="0" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="editorVisible = false">取消</el-button>
				<el-button type="primary" :loading="saving" @click="submitNav">
					{{ editingId ? '保存修改' : '创建' }}
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getAdminNav, createNav, updateNav, deleteNav, getAdminArticles } from '@/services/admin';
import { useNavStore } from '@/stores/nav';

const navStore = useNavStore();

const rawList = ref([]);
const listLoading = ref(false);
const editorVisible = ref(false);
const saving = ref(false);
const editingId = ref(null);

const form = reactive({
	name: '',
	path: '',
	parentId: null,
	sort: 0,
	visible: 1,
	articleId: null
});

// ===== 关联文章选择器 =====
const articleOptions = ref([]);
const articleLoading = ref(false);

const articleLabel = (a) => {
	return a.sub_title || a.subTitle ? `${a.title}(${a.sub_title || a.subTitle})` : a.title;
};

const loadArticles = async () => {
	if (articleOptions.value.length > 0 || articleLoading.value) return;
	articleLoading.value = true;
	try {
		const res = await getAdminArticles({ page: 1, pageSize: 50 });
		articleOptions.value = res?.list || [];
	} catch (e) {
		console.error('获取文章列表失败', e);
	} finally {
		articleLoading.value = false;
	}
};

const onArticleChange = (articleId) => {
	if (!articleId) return;
	const article = articleOptions.value.find((a) => Number(a.id) === Number(articleId));
	if (!article) return;
	form.name = article.title || form.name;
	form.path = `/info/scene?id=${article.id}`;
};

const normalizeVisible = (value) => {
	if (value === 0 || value === '0' || value === false) {
		return 0;
	}
	return 1;
};

// 扁平列表 -> 展示行(顶级在前,子级缩进跟随父级)
const displayRows = computed(() => {
	const items = rawList.value.map((item) => ({
		...item,
		parentId: item.parentId ?? null,
		sort: Number(item.sort) || 0,
		visible: normalizeVisible(item.visible)
	}));
	const byId = new Map(items.map((item) => [item.id, item]));
	const roots = items.filter((item) => {
		if (item.parentId === null || item.parentId === undefined) {
			return true;
		}
		return !byId.has(Number(item.parentId));
	});
	const rows = [];
	const byOrder = (a, b) => a.sort - b.sort || a.id - b.id;
	roots.sort(byOrder).forEach((root) => {
		rows.push({ ...root, depth: 0, prefix: '', key: `nav-${root.id}`, inheritHidden: false });
		items
			.filter((child) => Number(child.parentId) === Number(root.id))
			.sort(byOrder)
			.forEach((child) => {
				rows.push({
					...child,
					depth: 1,
					prefix: '└ ',
					key: `nav-${root.id}-${child.id}`,
					inheritHidden: root.visible !== 1
				});
			});
	});
	// 孤儿项(父级被删等异常)兜底展示
	items.forEach((item) => {
		if (!rows.some((row) => row.id === item.id)) {
			rows.push({ ...item, depth: 0, prefix: '', key: `nav-orphan-${item.id}` });
		}
	});
	return rows;
});

// 父级选择:仅顶级项可作为父级;编辑时排除自身
const parentOptions = computed(() => {
	return rawList.value.filter((item) => {
		if (editingId.value && Number(item.id) === Number(editingId.value)) {
			return false;
		}
		const pid = item.parentId;
		return pid === null || pid === undefined || pid === 0 || pid === '0';
	});
});

const initNavList = async () => {
	listLoading.value = true;
	try {
		const res = await getAdminNav();
		rawList.value = res?.list || [];
	} catch (e) {
		console.error('获取导航失败', e);
	} finally {
		listLoading.value = false;
	}
};

const openEditor = (row) => {
	editingId.value = row ? row.id : null;
	loadArticles();
	if (row) {
		form.name = row.name || '';
		form.path = row.path || '';
		form.parentId = row.parentId != null ? Number(row.parentId) : null;
		form.sort = Number(row.sort) || 0;
		form.visible = normalizeVisible(row.visible);
	} else {
		form.name = '';
		form.path = '';
		form.parentId = null;
		form.sort = 0;
		form.visible = 1;
	}
	form.articleId = null;
	editorVisible.value = true;
};

const submitNav = async () => {
	if (!form.name.trim()) {
		ElMessage.warning('请输入名称');
		return;
	}
	const payload = {
		name: form.name.trim(),
		path: form.path.trim(),
		parentId: form.parentId != null ? form.parentId : undefined,
		sort: form.sort,
		visible: form.visible
	};
	saving.value = true;
	try {
		if (editingId.value) {
			await updateNav(editingId.value, payload);
			ElMessage.success('修改成功！');
		} else {
			await createNav(payload);
			ElMessage.success('创建成功！');
		}
		editorVisible.value = false;
		initNavList();
		// 同步刷新顶部导航
		navStore.refresh();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	} finally {
		saving.value = false;
	}
};

const deleteTip = (row) => {
	const childCount = rawList.value.filter(
		(item) => Number(item.parentId) === Number(row.id)
	).length;
	return childCount > 0
		? `该项有 ${childCount} 个子项，删除后将级联删除子项，确认删除？`
		: '确认删除该导航项？';
};

const handleDelete = async (row) => {
	try {
		await deleteNav(row.id);
		ElMessage.success('已删除');
		initNavList();
		navStore.refresh();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	}
};

onMounted(() => {
	initNavList();
});
</script>

<style lang="less">
.admin_nav_wrapper {
	.page_header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
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
	.child_name {
		color: #606266;
		padding-left: 12px;
	}
	.full_width {
		width: 100%;
	}
	.form_tip {
		width: 100%;
		font-size: 12px;
		color: #909399;
		line-height: 1.4;
		margin-top: 2px;
	}
}
</style>
