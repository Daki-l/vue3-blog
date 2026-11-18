import http from '@/utils/axios';

/**
 * 文章列表 {page, pageSize, tag} -> {list, total}
 */
async function getArticles(params = {}) {
    return http.get('/articles', params);
}

/**
 * 文章详情 -> 文章对象(snake_case 字段)
 */
async function getArticleDetail(id) {
    return http.get(`/articles/${id}`);
}

export { getArticles, getArticleDetail };
