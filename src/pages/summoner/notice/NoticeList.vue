<template>
	<div class="notice_list">
		<el-tabs v-model="activeName" class="active_tabs" @tab-click="handleClick">
			<el-tab-pane label="公告" name="notice">
				<el-table border :data="noticeList" v-loading="onLoading">
					<el-table-column prop="typeName" label="引言" width="80">
						<template #default="{ row }">
							<span>{{ row.typeName === 'HB_TITLE_UPDATE' ? '更新' : '引导' }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="noticeTitle" label="标题">
						<template #default="{ row }">
							<span class="notice_title" @click="handleNoticeTitle(row)">{{ row.noticeTitle }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="startTime" label="登录日期" width="150"></el-table-column>
				</el-table>
			</el-tab-pane>
			<el-tab-pane label="活动" name="activity">
				<el-table border :data="noticeActivityList" v-loading="onLoading">
					<el-table-column prop="typeName" label="引言" width="80">
						<template #default="{ row }">
							<span>{{ row.typeName === 'HB_TITLE_UPDATE' ? '更新' : '引导' }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="noticeTitle" label="标题" />
					<el-table-column prop="startTime" label="登录日期" width="150"></el-table-column>
				</el-table>
			</el-tab-pane>
		</el-tabs>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getNoticeFn, getNoticesActivityFn } from '@/services/summonerServices/summonerServices.js';
import { summpnerStore } from '@/stores/summoner.js'
import { ElMessage } from 'element-plus';
const route = useRoute();
const router = useRouter();
const onLoading = ref(false);
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
		onLoading.value = true;
		let noticeReslut = await getNoticeFn();
		noticeList.value = noticeReslut?.notice_list || [];
		let noticeActivityReslut = await getNoticesActivityFn();
		noticeActivityList.value = noticeActivityReslut?.notice_list || [];
		onLoading.value = false;
		console.log('noticeActivityList--', noticeActivityList.value);

	} catch {
		Element.error('获取最新信息失败，请稍后重试！');
	}
};

const handleClick = (tab, event) => {
	console.log('tab--', tab);
	console.log('event--', event);
};

const handleNoticeTitle = (row) => {
    summpnerStore.noticeDetail = row;
	console.log('row--',summpnerStore.noticeDetail );
    router.push({ name: 'noticeDetail'})
};
</script>

<style lang="less">
.notice_list {
	.active_tabs {
		.notice_title {
			color: #0067e4;
			font-size: 16px;
			cursor: pointer;
			font-weight: 400;
		}
	}
}
</style>