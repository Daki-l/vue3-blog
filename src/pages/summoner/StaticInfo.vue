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
			text: 'smon_857_Sj3r72Df50g2H6G.apk',
			url: 'http://dn.qpyou.cn/smon/smon_857_Sj3r72Df50g2H6G.apk'
		}
	];
	fileList.value = curList;
	// try {
	// 	const response = await axios.get('https://summoner-static.gooliuqi.workers.dev/list', {
	// 		params: { folder: 'summoner/' }
	// 	});
	// 	let resData = response.data || [];
	// 	curList = [
	// 		...curList,
	// 		...resData.map((e) => {
	// 			return {
	// 				text: e,
	// 				download: true
	// 			};
	// 		})
	// 	];
	// 	fileList.value = curList;
	// } catch (error) {
	// 	fileList.value = curList;
	// 	errorMessage.value = error.response ? error.response.data : error.message;
	// }
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
  