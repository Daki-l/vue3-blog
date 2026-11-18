import http from '@/utils/axios';

/**
 * 全量兑换码列表(含 expired,管理页用) -> {list, updateTime}
 */
async function getAdminCoupons() {
    return http.get('/admin/coupons');
}

/**
 * 新增兑换码 {code, content}
 */
async function addCoupon(data) {
    return http.post('/admin/coupons', data);
}

/**
 * 更新兑换码 {status?, content?}
 */
async function updateCoupon(code, data) {
    return http.patch(`/admin/coupons/${encodeURIComponent(code)}`, data);
}

/**
 * 立即抓取兑换码
 */
async function syncCoupons() {
    return http.post('/admin/coupons/sync');
}

/**
 * 同步公告
 */
async function syncNotices() {
    return http.post('/admin/notices/sync');
}

/**
 * 全量留言(含回复) -> {list: [{id, nickname, content, created_at, replies: [...]}]}
 */
async function getAdminMessages() {
    return http.get('/admin/messages');
}

/**
 * 修改留言内容 {content}
 */
async function updateMessage(id, data) {
    return http.patch(`/admin/messages/${id}`, data);
}

/**
 * 删除留言
 */
async function deleteMessage(id) {
    return http.delete(`/admin/messages/${id}`);
}

/**
 * 修改回复内容 {content}
 */
async function updateReply(id, data) {
    return http.patch(`/admin/replies/${id}`, data);
}

/**
 * 删除回复
 */
async function deleteReply(id) {
    return http.delete(`/admin/replies/${id}`);
}

export {
    getAdminCoupons,
    addCoupon,
    updateCoupon,
    syncCoupons,
    syncNotices,
    getAdminMessages,
    updateMessage,
    deleteMessage,
    updateReply,
    deleteReply
};
