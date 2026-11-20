<template>
	<div class="static_info">
		<!-- 文件列表展示 -->
		<ul v-if="fileList.length">
			<li v-for="(file, index) in fileList" :key="index">
				<div v-if="file.download">
					<span>{{ file.text }}</span>
					<button @click="downloadFile(file.text)">{{ t('common.download') }}</button>
				</div>
				<div v-else>
					<a @click="openUrl(file)">
						<span>{{ file.text }}</span>
					</a>
					<p class="url">{{ file.desction }}</p>
				</div>
			</li>
		</ul>

		<!-- 错误提示 -->
		<p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>

		<!-- 下载文件的输入框 -->
		<div v-if="isDownloading">
			<p>{{ t('coupon.redeeming') }}</p>
		</div>
	</div>
</template>
  
<script setup>
import { t } from '@/common/i18n';
import { onMounted, ref } from 'vue';

// 定义响应式变量
const fileList = ref([]);
const errorMessage = ref('');
const isDownloading = ref(false);

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
	fileList.value = curList;
};

onMounted(() => {
	listFiles();
});

// 下载文件:直接打开官方 CDN 直链(不再经旧 summoner-static Worker 中转)
const downloadFile = (fileName) => {
	const file = fileList.value.find((f) => f.text === fileName);
	if (file && file.url) {
		window.open(file.url, '_blank');
	} else {
		errorMessage.value = '未找到下载地址';
	}
};
const openUrl = (file) => {
	window.open(file.url);
};
</script>
  
<style scoped lang="less">
.static_info {
	a {
		cursor: pointer;
	}
}
button {
	margin-left: 10px;
	padding: 5px 10px;
	cursor: pointer;
}

ul {
	list-style-type: none;
	padding-left: 0;
}

li {
	margin: 10px 0;
}

p {
	font-size: 14px;
	color: #303030;
}
</style>
  