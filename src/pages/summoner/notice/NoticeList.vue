<template>
	<div class="notice_list">
		<el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
			<el-tab-pane label="公告" name="notice">
				<el-table
					border
					:data="curList"
					v-loading="onLoading"
					:default-sort="{ prop: 'status', order: 'descending' }">
					<el-table-column prop="content" label="引言" />
					<el-table-column prop="createTime" label="标题" width="180" />
					<el-table-column prop="status" label="登录日期" width="80"></el-table-column>
				</el-table>
			</el-tab-pane>
			<el-tab-pane label="活动" name="activity"></el-tab-pane>
		</el-tabs>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getNoticeFn, getNoticesActivityFn } from '@/services/summonerServices/summonerServices.js';
import { ElMessage } from 'element-plus';
const route = useRoute();
const router = useRouter();
const onloading = ref(false);
const curList = ref([]);
const noticeList = ref([]);
const noticeActivityList = ref([]);
const activeName = ref('');

onMounted(() => {
	console.log('route--', route);
	let { query = {} } = route;
	let { key } = query;
	activeName.value = key || 'notice';
	initNoticeList();
});

const initNoticeList = async () => {
	try {
		onloading.value = true;
		let noticeReslut = await getNoticeFn();
		noticeList.value = noticeReslut?.notice_list || [];
		let noticeActivityReslut = await getNoticesActivityFn();
		noticeActivityList.value = noticeActivityReslut?.notice_list || [];
		onloading.value = false;
	} catch {
		Element.error('获取最新信息失败，请稍后重试！');
	}
};
</script>

<style lang="less">
.notice_list {
}
</style>