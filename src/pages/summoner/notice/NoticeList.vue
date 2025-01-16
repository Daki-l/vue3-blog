<template>
	<div class="notice_list">
		<el-tabs v-model="activeName" class="active_tabs" @tab-click="handleClick">
			<el-tab-pane label="公告" name="notice">
				<el-table border :data="noticeList" v-loading="onLoading" v-infinite-scroll="loadMore">
					<el-table-column prop="typeName" label="引言" width="80">
						<template #default="{ row }">
							<span>{{ row.typeName === 'HB_TITLE_UPDATE' ? '更新' : '引导' }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="noticeTitle" label="标题">
						<template #default="{ row }">
							<span class="notice_title" @click="openDetail(row)">{{ row.noticeTitle }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="startTime" label="登录日期" width="150"></el-table-column>
				</el-table>
			</el-tab-pane>
			<el-tab-pane label="活动" name="activity">
                <div class="activity_card" v-for="(item, index) in noticeActivityList" :key="index" @click="openDetail(item)">
                    <img class="actitity_img" :src="item.cropImage" alt="" />
                    <div class="activity_title">
                        <span>{{ item.noticeTitle }}</span>
                        <span class="time">{{ item.startTime }}</span>
                    </div>
                </div>
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
		ElMessage.error('获取最新信息失败，请稍后重试！');
	}
};

const loadMore = async () => {

}

const handleClick = (tab, event) => {
	console.log('tab--', tab);
	console.log('event--', event);
};

const openDetail = (row) => {
    summpnerStore.noticeDetail = row;
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
        .activity_card {
            cursor: pointer;
			width: 386px;
			height: 303px;
			margin-left: 24px;
			margin-bottom: 24px;
			float: left;
			background-color: #ffffff;
			.actitity_img {
				width: 100%;
				height: 217px;
				border-radius: 16px 16px 0 0;
			}
			.activity_title {
				position: relative;
				width: 100%;
				padding: 10px;
				border-top: #bebebe;
				font-size: 16px;
				font-weight: 600;
				.time {
					position: absolute;
					right: 3px;
					bottom: -18px;
					font-size: 16px;
				}
			}
		}
	}
}
</style>