<template>
	<div class="summoner_home_wrapper">
		<div class="wrapper_top">
			<div class="top_left">
				<div class="left_header">
					<img
						src="https://hive-fn.qpyou.cn/hubweb/hive_img/A/A/1317/20151210/85e21cbd184bd8f5371c77dbe923e8ac.jpg"
						alt="魔灵召唤" />
					<div class="left_title">
						<span>{{ title }}</span>
						<span class="left_type">RPG</span>
					</div>
				</div>
				<div class="left_description">全球实时战略角色扮演 全世界1亿+下载量！ 130多国创第一</div>
				<div class="left_btns">
					<el-button type="default" @click="openUrl('Android')">安卓下载</el-button>
					<el-button type="default" @click="openUrl('IOS')">苹果下载</el-button>
					<el-button type="default" @click="openUrl('service')">客服投诉地址</el-button>
				</div>
			</div>
			<div class="top_right">
				<div class="notice_top">
					<span>公告：</span>
					<el-button class="more" type="primary" link @click="moreNotice">更多</el-button>
				</div>
				<div class="notice_list" v-loading="onloading">
					<span class="notice_item" v-for="(item, index) in noticeList" :key="index">
						<span>{{ item.noticeTitle }}</span>
						<span>{{ item.startTime }}</span>
					</span>
				</div>
			</div>
		</div>
		<section class="wrapper_activity" v-loading="onloading">
			<div class="activity_card" v-for="(item, index) in noticeActivityList" :key="index">
				<img class="actitity_img" :src="item.cropImage" alt="" />
				<div class="activity_title">
					<span>{{ item.noticeTitle }}</span>
					<span class="time">{{ item.startTime }}</span>
				</div>
			</div>
		</section>
		<div class="wrapper_list">
			<div class="artical_title">推荐文章：</div>
			<div class="artical_list">
				<div class="artical_item">
					<span>{{ '文章一' }}</span>
				</div>
				<div class="artical_item">
					<span>{{ '文章一' }}</span>
				</div>
				<div class="artical_item">
					<span>{{ '文章一' }}</span>
				</div>
			</div>
		</div>
	</div>
</template>
  
<script setup>
import { onMounted, ref } from 'vue';
import { getNoticeFn, getNoticesActivityFn } from '@/services/summonerServices/summonerServices.js';
import { ElMessage } from 'element-plus';

const title = ref('魔灵召唤：天空之役');

// 定义响应式变量
const errorMessage = ref('');
const onloading = ref(false);
const noticeList = ref([]);
const noticeActivityList = ref([]);

const urlOption = ref({
	IOS: 'https://apps.apple.com/cn/app/魔灵召唤-天空之影/id852912420',
	Android: '',
	service: 'https://customer.withhive.com/com2us/ask/313'
});

onMounted(() => {
	listFiles();
	initNoticeList();
});
// 列出文件
const listFiles = async () => {
	errorMessage.value = '';
	let curList = [
		{
			text: 'smon_857_Sj3r72Df50g2H6G.apk',
			url: 'http://dn.qpyou.cn/smon/smon_857_Sj3r72Df50g2H6G.apk',
			path2: 'https://play.qpyou.cn/r?c=7976',
			path: 'http://play.qpyou.cn/b?i=8387&g=8109&gc=7976'
		}
	];
	urlOption.value.Android = curList[0].url;
};

const initNoticeList = async () => {
	try {
		onloading.value = true;
		let noticeReslut = await getNoticeFn();
		noticeList.value = noticeReslut?.notice_list || [];
		let noticeActivityReslut = await getNoticesActivityFn();
		noticeActivityList.value = noticeActivityReslut?.notice_list || [];
		onloading.value = false;
	} catch {
		ElMessage.error('获取最新信息失败，请稍后重试！');
		onloading.value = false;
	}
};

const moreNotice = () => {
	ElMessage.info('开发中！');
};

const openUrl = (key) => {
	let option = urlOption.value;
	window.open(option[key]);
};
</script>
  
<style scoped lang="less">
.summoner_home_wrapper {
	.wrapper_top {
		display: flex;
		padding: 30px 0;
		background-color: #ffffff;
		.top_left {
			width: 40%;
			padding-left: 30px;
			.left_header {
				height: 130px;
				padding-left: 20px;
				display: flex;
				align-items: center;
				img {
					width: 130px;
					height: 130px;
					border-radius: 16px;
					// visibility: hidden;
				}
				.left_title {
					font-size: 16px;
					font-weight: 600;
					margin-left: 30px;
					color: #313131;
					.left_type {
						color: #0067ef;
						font-size: 14px;
						display: block;
					}
				}
			}
			.left_description {
				padding: 20px 0;
			}
		}
		.top_right {
			width: 60%;
			max-height: 250px;
			padding-left: 24px;
			.notice_top {
				font-size: 16px;
				font-weight: 600;
				color: #313131;
				height: 40px;
				display: flex;
				align-items: center;
				justify-content: space-between;
				.more {
					font-size: 16px;
					font-weight: 600;
				}
			}
			.notice_list {
				height: calc(100% - 40px);
				display: flex;
				flex-direction: column;
				overflow-y: auto;
				.notice_item {
					cursor: pointer;
					padding-right: 12px;
					display: flex;
					justify-content: space-between;
					color: #0067e4;
					margin-bottom: 12px;
				}
			}
		}
	}
	.wrapper_activity {
		height: 303px;
		overflow: auto;
		margin-top: 20px;
		.activity_card {
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
	.wrapper_list {
		margin-top: 20px;
		background-color: #ffffff;
		padding: 24px;
		.artical_title {
			font-size: 16px;
			font-weight: 600;
			color: #313131;
			padding: 0px 0 10px;
		}
		.artical_list {
		}
	}
}
</style>
  