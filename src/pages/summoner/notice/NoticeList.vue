<template>
	<div class="notice_list">
		<el-tabs v-model="activeName" class="active_tabs">
			<el-tab-pane label="公告" name="notice">
				<el-table border :data="noticeList" v-loading="onLoading">
					<el-table-column prop="noticeTitle" label="标题">
						<template #default="{ row }">
							<span class="notice_title" @click="openDetail(row)">{{ row.noticeTitle }}</span>
						</template>
					</el-table-column>
					<el-table-column prop="startTime" label="发布日期" width="180"></el-table-column>
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
import { getNotices } from '@/services/notice';
import { useNoticeStore } from '@/stores/notice.js';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const noticeStore = useNoticeStore();
const onLoading = ref(false);
const noticeList = ref([]);
const noticeActivityList = ref([]);
const activeName = ref('');

onMounted(() => {
	let { query = {} } = route;
	let { key } = query;
	activeName.value = key || 'notice';
	initNoticeList();
});

const initNoticeList = async () => {
	try {
		let { getNoticeTime } = noticeStore;
		// 缓存 3 小时内直接使用内存缓存
		let timeFlag = !getNoticeTime || new Date().getTime() - getNoticeTime > (3 * 3600000) ? false : true;

		if ((noticeStore?.noticeList || []).length > 0 && (noticeStore?.noticeActivityList || []).length > 0 && timeFlag) {
			noticeList.value = noticeStore?.noticeList || [];
			noticeActivityList.value = noticeStore?.noticeActivityList || [];
		} else {
			onLoading.value = true;
			const [noticeReslut, noticeActivityReslut] = await Promise.all([
				getNotices('notice'),
				getNotices('activity')
			]);
			let curNoticeList = noticeReslut?.list || [];
			let curNoticeActivityList = noticeActivityReslut?.list || [];
			noticeList.value = curNoticeList;
			noticeActivityList.value = curNoticeActivityList;
			noticeStore.noticeList = curNoticeList;
			noticeStore.noticeActivityList = curNoticeActivityList;
			noticeStore.getNoticeTime = new Date().getTime();
			onLoading.value = false;
		}
	} catch {
		ElMessage.error('获取最新信息失败，请稍后重试！');
		onLoading.value = false;
	}
};

const openDetail = (row) => {
	noticeStore.noticeDetail = row;
	router.push({ name: 'noticeDetail', query: { id: row.id } });
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
	// 手机 web:活动卡片两列,高度自然(公告表格由 el-table 自带横向滚动)
	@media (max-width: 768px) {
		padding: 0 12px;
		.active_tabs {
			.activity_card {
				width: calc(50% - 12px);
				height: auto;
				margin-left: 12px;
				margin-bottom: 28px;
				.actitity_img {
					height: auto;
				}
				.activity_title {
					font-size: 14px;
					.time {
						position: static;
						display: block;
						font-size: 13px;
						font-weight: 400;
						color: #909399;
					}
				}
			}
		}
	}
}
</style>
