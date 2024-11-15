import axios from '@/utils/axios';
// import constant from '@/utils/constant';

// const baseUrl = `${constant.baseUrl}`;

async function getArticleList() {
    return axios.get(`article/v1/list`);
}

async function getArticleDetailById(id) {
    return axios.get(`article/v1/detail?id=${id}`);
}

export {
    getArticleList,
    getArticleDetailById
};
