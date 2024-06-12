import axios from '@/utils/axios';
import constant from '@/utils/constant';

const baseUrl = `${constant.baseUrl}`;

async function getArticleList() {
	return axios.get(`${baseUrl}/article/v1/list`);
}

export { getArticleList };
