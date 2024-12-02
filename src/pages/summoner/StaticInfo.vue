<template>
	<div class="static_info">
		<!-- 文件列表展示 -->
		<ul v-if="fileList.length">
			<li v-for="(file, index) in fileList" :key="index">
				<div v-if="file.download">
					<span>{{ file.text }}</span>
					<button @click="downloadFile(file.text)">下载</button>
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
			<p>正在下载...</p>
		</div>
	</div>
</template>
  
  <script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';

// 定义响应式变量
const fileList = ref([]);
const errorMessage = ref('');
const isDownloading = ref(false);

// 列出文件
const listFiles = async () => {
	errorMessage.value = '';
	let curList = [
		{
			text: 'smon_855_JK3dW6di2l8uNS0.apk',
			url: 'https://pan.quark.cn/s/b677e8d56dbe',
			desction:
				'我用夸克网盘分享了「smon_855_JK3dW6di2l8uNS0.apk」，点击链接即可保存。打开「夸克APP」，无需下载在线播放视频，畅享原画5倍速，支持电视投屏。链接：https://pan.quark.cn/s/b677e8d56dbe'
		}
	];
	try {
		const response = await axios.get('https://summoner-static.gooliuqi.workers.dev/list', {
			params: { folder: 'summoner/' }
		});
		let resData = response.data || [];
		curList = [
			...curList,
			...resData.map((e) => {
				return {
					text: e,
					download: true
				};
			})
		];
		fileList.value = curList;
	} catch (error) {
		fileList.value = curList;
		errorMessage.value = error.response ? error.response.data : error.message;
	}
};

onMounted(() => {
	listFiles();
});

// 下载文件
const downloadFile = async (fileName) => {
	isDownloading.value = true;
	try {
		const response = await axios.get('https://summoner-static.gooliuqi.workers.dev/download', {
			params: { file: fileName },
			responseType: 'blob' // 指定响应类型为 blob
		});

		const blob = response.data;
		const downloadLink = document.createElement('a');
		downloadLink.href = URL.createObjectURL(blob);
		downloadLink.download = fileName;
		downloadLink.click();
	} catch (error) {
		errorMessage.value = error.response ? error.response.data : error.message;
	} finally {
		isDownloading.value = false;
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
  