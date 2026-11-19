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
					<el-button
						v-for="btn in primaryBtns"
						:key="btn.key"
						type="default"
						@click="openUrl(btn.key)">{{ btn.label }}</el-button>
					<el-dropdown trigger="click" @command="openUrl">
						<el-button type="default" class="more_btn">更多 ▾</el-button>
						<template #dropdown>
							<el-dropdown-menu>
								<el-dropdown-item
									v-for="btn in moreBtns"
									:key="btn.key"
									:command="btn.key">{{ btn.label }}</el-dropdown-item>
							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</div>
			</div>
			<div class="top_right">
				<div class="notice_top">
					<span>公告：</span>
				</div>
				<div class="notice_list" v-loading="onLoading">
					<span class="notice_item" v-for="(item, index) in noticeList" :key="index" @click="openDetail(item)">
						<span>{{ item.noticeTitle }}</span>
						<span>{{ item.startTime }}</span>
					</span>
				</div>
			</div>
		</div>
		<section class="wrapper_activity" v-loading="onLoading">
			<div class="activity_card" v-for="(item, index) in noticeActivityList" :key="index" @click="openDetail(item)">
				<img class="actitity_img" :src="item.cropImage" alt="" />
				<div class="activity_title">
					<span>{{ item.noticeTitle }}</span>
					<span class="time">{{ item.startTime }}</span>
				</div>
			</div>
		</section>
		<div class="wrapper_list" v-if="false">
			<div class="artical_title">推荐文章：</div>
			<div class="artical_list">
				<div class="artical_item">
					<span>{{ '文章一' }}</span>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getNotices } from '@/services/notice';
import { ElMessage } from 'element-plus';
import { useNoticeStore } from '@/stores/notice.js';

const router = useRouter();
const noticeStore = useNoticeStore();
const title = ref('魔灵召唤：天空之役');

const onLoading = ref(false);
const noticeList = ref([]);
const noticeActivityList = ref([]);

const urlOption = ref({
	IOS: 'https://apps.apple.com/cn/app/魔灵召唤-天空之影/id852912420',
	Android: 'http://play.qpyou.cn/b?i=8387&g=8109&gc=7976',
	service: 'https://customer.withhive.com/com2us/ask/313',
	terms: 'https://terms.withhive.com/terms/policy/view/M337'
});

// 主按钮(常驻展示)与更多下拉(后续新增入口往这里追加即可)
const primaryBtns = [
	{ key: 'Android', label: '安卓下载' },
	{ key: 'IOS', label: '苹果下载' }
];
const moreBtns = [
	{ key: 'service', label: '客服投诉地址' },
	{ key: 'terms', label: '官方服务条款' }
];

onMounted(() => {
	initNoticeList();
});

const initNoticeList = async () => {
	try {
		let { getNoticeTime } = noticeStore;
		// 缓存 12 小时内直接使用内存缓存
		let timeFlag = !getNoticeTime || new Date().getTime() - getNoticeTime > (12 * 3600000) ? false : true;

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

const openUrl = (key) => {
	let option = urlOption.value;
	window.open(option[key]);
};

const openDetail = (row) => {
	noticeStore.noticeDetail = row;
	router.push({ name: 'noticeDetail', query: { id: row.id } });
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
			.left_btns {
				display: flex;
				flex-wrap: wrap;
				gap: 10px;
				padding-right: 24px;
				.el-button {
					margin-left: 0;
				}
			}
		}
	.top_right {
		width: 60%;
		padding-left: 24px;
		// 文字公告保持固定高度+内部滚动(原样式);带图活动区下方自然流式
		max-height: 250px;
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
			overflow-y: auto;
			display: flex;
			flex-direction: column;
				.notice_item {
					cursor: pointer;
					padding-right: 12px;
					display: flex;
					justify-content: space-between;
					color: #0067e4;
					margin-bottom: 12px;
					span {
						white-space: nowrap;
					}
					span:first-child {
						overflow: hidden;
						text-overflow: ellipsis;
					}
				}
			}
		}
	}
	// 活动卡片自然流式:随内容下移,无内部小滚动条
	.wrapper_activity {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		margin-top: 20px;
		padding: 0 24px;
		.activity_card {
			cursor: pointer;
			flex: 0 0 calc((100% - 48px) / 3);
			height: 280px;
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
	// 手机 web:两栏纵向堆叠,按钮换行,活动卡片两列
	@media (max-width: 768px) {
		.wrapper_top {
			flex-direction: column;
			padding: 16px 12px;
			.top_left {
				width: 100%;
				padding-left: 0;
				.left_header {
					height: auto;
					padding-left: 0;
					img {
						width: 96px;
						height: 96px;
					}
					.left_title {
						margin-left: 14px;
					}
				}
				.left_description {
					padding: 12px 0;
				}
			}
			.left_btns {
				display: flex;
				flex-wrap: wrap;
				gap: 8px;
				.el-button {
					margin-left: 0;
					flex: 1 1 calc(50% - 8px);
				}
			}
			.top_right {
				width: 100%;
				padding-left: 0;
				margin-top: 16px;
				.notice_list {
					.notice_item {
						flex-direction: column;
						align-items: flex-start;
						gap: 2px;
					}
				}
			}
		}
		.wrapper_activity {
			padding: 0 12px;
			gap: 24px 12px;
			.activity_card {
				flex: 0 0 calc((100% - 12px) / 2);
				height: auto;
				.actitity_img {
					height: auto;
				}
				.activity_title {
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
		.wrapper_list {
			padding: 16px 12px;
		}
	}
}
</style>
