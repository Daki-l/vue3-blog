/**
 * 3v3 互动服务(登录制):赞踩 / 收藏 / 评论
 * 走 lnow-site-api(动态数据);静态数据仍走 /sw/data。
 * token 附加与刷新由 utils/axios 拦截器统一处理。
 */
import http from '@/utils/axios';

/**
 * 批量拉取目标的赞踩统计与"我的"选择
 * GET /3mdc/stats?target_type=counter&ids=1,2,3
 * -> { stats: { [id]: {likes, dislikes} }, mine: { [id]: 1|-1 } }
 */
function getStats(targetType, ids) {
    return http.get('/3mdc/stats', { target_type: targetType, ids: ids.join(',') });
}

/**
 * 赞/踩(toggle:同值再点=取消)
 * POST /3mdc/reactions {target_type, target_id, value: 1|-1}
 * -> { value, likes, dislikes }
 */
function react(targetType, targetId, value) {
    return http.post('/3mdc/reactions', { target_type: targetType, target_id: targetId, value });
}

/**
 * 收藏开关
 * POST /me/favorites {target_type, target_id} -> { on: boolean }
 */
function toggleFavorite(targetType, targetId) {
    return http.post('/3mdc/favorites', { target_type: targetType, target_id: targetId });
}

/**
 * 我的收藏列表 -> { list: [{target_type, target_id, created_at}] }
 */
function getFavorites() {
    return http.get('/3mdc/favorites');
}

/**
 * 评论列表(泛化,含回复)
 * GET /comments?target_type=defense&target_id=123&page=1 -> {list, total}
 */
function getComments(targetType, targetId, page = 1) {
    return http.get('/comments', { target_type: targetType, target_id: targetId, page });
}

/**
 * 发评论(登录制,展示账号昵称) -> {comment}
 */
function addComment(targetType, targetId, content) {
    return http.post('/comments', { target_type: targetType, target_id: targetId, content });
}

/**
 * 回复评论 -> {reply}
 */
function addReply(commentId, content, targetReplyId) {
    return http.post(`/comments/${commentId}/replies`, { content, targetReplyId });
}

export { getStats, react, toggleFavorite, getFavorites, getComments, addComment, addReply };
