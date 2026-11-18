import http from '@/utils/axios';

/**
 * 留言列表 {page} -> {list: [{id, nickname, content, created_at, replies: [...]}], total}
 */
async function getMessages(page = 1) {
    return http.get('/messages', { page });
}

/**
 * 发表留言(游客可发) {nickname, content}
 */
async function addMessage(data) {
    return http.post('/messages', data);
}

/**
 * 回复留言(游客可发) {nickname, content}
 */
async function addReply(messageId, data) {
    return http.post(`/messages/${messageId}/replies`, data);
}

export { getMessages, addMessage, addReply };
