<template>
	<div class="admin_notices_wrapper">
		<div class="page_header">
			<span class="page_title">公告管理</span>
			<div class="header_btns">
				<el-button link type="primary" :loading="listLoading" @click="initNoticeList">刷新</el-button>
				<el-button type="warning" :loading="syncLoading" @click="handleSyncHive">
					同步Hive公告
				</el-button>
				<el-button type="primary" @click="openEditor(null)">新增公告</el-button>
			</div>
		</div>
		<el-alert
			title="此处仅管理手动公告(source=manual)；「同步Hive公告」只刷新 Hive 来源行，不会覆盖手动公告"
			type="info"
			show-icon
			:closable="false"
			class="tip_alert" />
		<el-table :data="manualNoticeList" border style="width: 100%" v-loading="listLoading">
			<el-table-column prop="id" label="ID" width="70" sortable />
			<el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
				<template #default="{ row }">{{ row.noticeTitle || row.title || '-' }}</template>
			</el-table-column>
			<el-table-column label="置顶" width="90">
				<template #default="{ row }">
					<el-tag :type="row.pinned ? 'danger' : 'info'">{{ row.pinned ? '已置顶' : '否' }}</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="发布时间" width="170">
				<template #default="{ row }">{{ row.startTime || row.start_time || '-' }}</template>
			</el-table-column>
			<el-table-column prop="source" label="来源" width="90">
				<template #default>
					<el-tag type="warning">手动</el-tag>
				</template>
			</el-table-column>
			<el-table-column label="操作" width="220" align="right">
				<template #default="{ row }">
					<el-button type="primary" link @click="togglePinned(row)">
						{{ row.pinned ? '取消置顶' : '置顶' }}
					</el-button>
					<el-button type="primary" link @click="openEditor(row)">编辑</el-button>
					<el-popconfirm title="确认删除该公告？" @confirm="handleDelete(row)">
						<template #reference>
							<el-button type="danger" link>删除</el-button>
						</template>
					</el-popconfirm>
				</template>
			</el-table-column>
			<template #empty>
				<el-empty description="暂无手动公告，点击右上角「新增公告」创建" :image-size="80" />
			</template>
		</el-table>

		<!-- 新增/编辑弹窗 -->
		<el-dialog
			v-model="editorVisible"
			:title="editingId ? '编辑公告' : '新增公告'"
			width="640"
			:close-on-click-modal="false">
			<el-form :model="form" label-width="90px">
				<el-form-item label="标题" required>
					<el-input v-model="form.title" maxlength="100" placeholder="公告标题" />
				</el-form-item>
				<el-form-item label="发布时间">
					<el-date-picker
						v-model="form.start_time"
						type="datetime"
						value-format="YYYY-MM-DD HH:mm:ss"
						placeholder="选填,默认当前时间"
						class="full_width" />
				</el-form-item>
				<el-form-item label="图片URL">
					<el-input v-model="form.image_url" placeholder="公告配图完整 URL(选填)" />
				</el-form-item>
				<el-form-item label="内容" required>
					<el-input
						v-model="form.content_html"
						type="textarea"
						:rows="8"
						placeholder="公告内容,支持 HTML" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="editorVisible = false">取消</el-button>
				<el-button type="primary" :loading="saving" @click="submitNotice">
					{{ editingId ? '保存修改' : '创建' }}
				</el-button>
			</template>
		</el-dialog>
	</div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getNotices } from '@/services/notice';
import {
	syncNotices,
	createManualNotice,
	updateManualNotice,
	deleteManualNotice
} from '@/services/admin';

const manualNoticeList = ref([]);
const listLoading = ref(false);
const syncLoading = ref(false);
const editorVisible = ref(false);
const saving = ref(false);
const editingId = ref(null);

const form = reactive({
	title: '',
	start_time: '',
	image_url: '',
	content_html: ''
});

// 手动公告来自公开合并列表(GET /notices),按 source='manual' 过滤
const initNoticeList = async () => {
	listLoading.value = true;
	try {
		const res = await getNotices('notice');
		manualNoticeList.value = (res?.list || []).filter((item) => item.source === 'manual');
	} catch (e) {
		console.error('获取公告失败', e);
	} finally {
		listLoading.value = false;
	}
};

const handleSyncHive = async () => {
	syncLoading.value = true;
	try {
		await syncNotices();
		ElMessage.success('Hive 公告同步任务已提交！');
		initNoticeList();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	} finally {
		syncLoading.value = false;
	}
};

const openEditor = (row) => {
	editingId.value = row ? row.id : null;
	if (row) {
		form.title = row.noticeTitle || row.title || '';
		form.start_time = (row.startTime || row.start_time || '').replace('T', ' ').slice(0, 19) || '';
		form.image_url = row.cropImage || row.image_url || '';
		form.content_html = row.content || row.content_html || '';
	} else {
		form.title = '';
		form.start_time = '';
		form.image_url = '';
		form.content_html = '';
	}
	editorVisible.value = true;
};

const submitNotice = async () => {
	if (!form.title.trim()) {
		ElMessage.warning('请输入标题');
		return;
	}
	if (!form.content_html.trim()) {
		ElMessage.warning('请输入内容');
		return;
	}
	const payload = {
		title: form.title.trim(),
		content_html: form.content_html,
		image_url: form.image_url.trim() || undefined,
		start_time: form.start_time || undefined
	};
	saving.value = true;
	try {
		if (editingId.value) {
			await updateManualNotice(editingId.value, payload);
			ElMessage.success('修改成功！');
		} else {
			await createManualNotice(payload);
			ElMessage.success('创建成功！');
		}
		editorVisible.value = false;
		initNoticeList();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	} finally {
		saving.value = false;
	}
};

const togglePinned = async (row) => {
	try {
		await updateManualNotice(row.id, { pinned: row.pinned ? 0 : 1 });
		ElMessage.success(row.pinned ? '已取消置顶' : '已置顶');
		initNoticeList();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	}
};

const handleDelete = async (row) => {
	try {
		await deleteManualNotice(row.id);
		ElMessage.success('已删除');
		initNoticeList();
	} catch (e) {
		// 错误提示由 axios 拦截器统一处理
	}
};

onMounted(() => {
	initNoticeList();
});
</script>

<style lang="less">
.admin_notices_wrapper {
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
	.tip_alert {
		margin-bottom: 12px;
	}
	.full_width {
		width: 100%;
	}
}
</style>
