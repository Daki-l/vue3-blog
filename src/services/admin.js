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
 * 同步公告(仅刷新 source='hive' 的行)
 */
async function syncNotices() {
    return http.post('/admin/notices/sync');
}

/**
 * 数据看板 -> {users, coupons:{total,verified}, messages, redemptions:{total,today}, trend:[{date,count}]}
 */
async function getAdminStats() {
    return http.get('/admin/stats');
}

// ===== 文章管理 =====

/**
 * 访问统计 {days} -> {list:[{day,cacheHits,apiFetches,ipCount,totalQueries}],summary}
 */
async function getVisitStats(params) {
    return http.get('/admin/visit-stats', params);
}

/**
 * 召唤师管理(按 Hive ID 聚合) {page,pageSize,keyword} -> {list,total}
 */
async function getAdminSummoners(params) {
    return http.get('/admin/summoners', params);
}

/**
 * 管理端文章列表(含草稿) {page,pageSize,keyword} -> {list,total}
 */
async function getAdminArticles(params) {
    return http.get('/admin/articles', params);
}

/**
 * 管理端文章详情(含草稿) -> {article}
 */
async function getAdminArticleDetail(id) {
    return http.get(`/admin/articles/${id}`);
}

/**
 * 新建文章 {title, sub_title?, tags?, intro?, content_md, cover_url?, status(0|1), pub_date?} -> 201 {article}
 */
async function createArticle(data) {
    return http.post('/admin/articles', data);
}

/**
 * 更新文章(任一字段) -> {article}
 */
async function updateArticle(id, data) {
    return http.patch(`/admin/articles/${id}`, data);
}

/**
 * 删除文章 -> {success:true}
 */
async function deleteArticle(id) {
    return http.delete(`/admin/articles/${id}`);
}

// ===== 账号管理 =====

/**
 * 用户列表 {keyword?} -> {list:[{id,username,role,status,nickname,createdAt}]}
 */
async function getAdminUsers(params = {}) {
    return http.get('/admin/users', params);
}

/**
 * 更新用户 {role?, status?, nickname?} -> {user}
 */
async function updateAdminUser(id, data) {
    return http.patch(`/admin/users/${id}`, data);
}

/**
 * 重置密码 -> {password}(随机 12 位,仅返回一次)
 */
async function resetAdminUserPassword(id) {
    return http.post(`/admin/users/${id}/reset-password`);
}

/**
 * 删除用户 -> {success:true}
 */
async function deleteAdminUser(id) {
    return http.delete(`/admin/users/${id}`);
}

// ===== 导航管理 =====

/**
 * 导航全量列表(含隐藏) -> {list}
 */
async function getAdminNav() {
    return http.get('/admin/nav');
}

/**
 * 新增导航 {name, parentId?, path, sort?, visible?} -> 201 {item}
 */
async function createNav(data) {
    return http.post('/admin/nav', data);
}

/**
 * 更新导航 {name?, path?, sort?, visible?, parentId?} -> {item}
 */
async function updateNav(id, data) {
    return http.patch(`/admin/nav/${id}`, data);
}

/**
 * 删除导航(有子项时级联删除) -> {success:true}
 */
async function deleteNav(id) {
    return http.delete(`/admin/nav/${id}`);
}

// ===== 手动公告管理 =====

/**
 * 新增手动公告 {title, content_html, image_url?, start_time?} -> 201 {notice}
 */
async function createManualNotice(data) {
    return http.post('/admin/notices', data);
}

/**
 * 更新手动公告(仅 manual 可改) {title?, content_html?, image_url?, pinned?} -> {notice}
 */
async function updateManualNotice(id, data) {
    return http.patch(`/admin/notices/${id}`, data);
}

/**
 * 删除手动公告(仅 manual 可删) -> {success:true}
 */
async function deleteManualNotice(id) {
    return http.delete(`/admin/notices/${id}`);
}

// ===== 兑换记录 =====

/**
 * 兑换记录 {page, pageSize, hiveid?, code?, userId?, date?} -> {list, total}
 */
async function getAdminRedemptions(params = {}) {
    return http.get('/admin/redemptions', params);
}

// ===== 留言管理 =====

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

/**
 * D1 限额降级状态 -> {degraded, flag, buffered}
 */
async function getDegradeStatus() {
    return http.get('/admin/degrade');
}

/**
 * 手动开/关降级 {enabled}
 */
async function setDegradeEnabled(enabled) {
    return http.post('/admin/degrade', { enabled });
}

/**
 * 立即重放缓冲流水 -> {replayed, remaining}
 */
async function replayDegradeBuffer() {
    return http.post('/admin/degrade/replay');
}

/**
 * 历史 check 事件(兑换尝试痕迹) {hiveid, page, pageSize} -> {list,total}
 */
async function getCheckHistory(params) {
    return http.get('/admin/check-history', params);
}

/**
 * 召唤师详情统一记录(兑换+历史查询合并时间线) {hiveid, page, pageSize} -> {list,total}
 */
async function getSummonerRecords(params) {
    return http.get('/admin/summoner-records', params);
}

// ===== 自动兑换 =====

/**
 * 概览 -> {enabled, setAt, allowlist, accounts, pending, today:{calls,success,used}, lastRun}
 */
async function getAutoRedeemOverview() {
    return http.get('/admin/auto-redeem/overview');
}

/**
 * 总开关 {enabled} -> {enabled, setAt}
 */
async function setAutoRedeemConfig(enabled) {
    return http.patch('/admin/auto-redeem/config', { enabled });
}

/**
 * 白名单 -> {list:[{userId, username, nickname, role, status, note, createdAt, autoAccounts}]}
 */
async function getAutoRedeemAllowlist() {
    return http.get('/admin/auto-redeem/allowlist');
}

/**
 * 加入白名单 {userId, note?} -> {item}
 */
async function addAutoRedeemAllowlist(userId, note) {
    return http.post('/admin/auto-redeem/allowlist', { userId, note });
}

/**
 * 移出白名单 -> {success:true}
 */
async function removeAutoRedeemAllowlist(userId) {
    return http.delete(`/admin/auto-redeem/allowlist/${userId}`);
}

/**
 * 已开启自动兑换的账号 -> {list}
 */
async function getAutoRedeemAccounts() {
    return http.get('/admin/auto-redeem/accounts');
}

/**
 * 运行记录 {page, pageSize} -> {list, total}
 */
async function getAutoRedeemRuns(params = {}) {
    return http.get('/admin/auto-redeem/runs', params);
}

/**
 * 立即执行一个切片 -> {run}
 */
async function runAutoRedeemNow() {
    return http.post('/admin/auto-redeem/run');
}

/**
 * 账本 {page, pageSize, status?, keyword?} -> {list, total}
 */
async function getAutoRedeemLedger(params = {}) {
    return http.get('/admin/auto-redeem/ledger', params);
}

export {
    getAdminCoupons,
    getSummonerRecords,
    getCheckHistory,
    getDegradeStatus,
    setDegradeEnabled,
    replayDegradeBuffer,
    getAutoRedeemOverview,
    setAutoRedeemConfig,
    getAutoRedeemAllowlist,
    addAutoRedeemAllowlist,
    removeAutoRedeemAllowlist,
    getAutoRedeemAccounts,
    getAutoRedeemRuns,
    runAutoRedeemNow,
    getAutoRedeemLedger,
    getVisitStats,
    getAdminSummoners,
    getAdminArticles,
    getAdminArticleDetail,
    addCoupon,
    updateCoupon,
    syncCoupons,
    syncNotices,
    getAdminStats,
    createArticle,
    updateArticle,
    deleteArticle,
    getAdminUsers,
    updateAdminUser,
    resetAdminUserPassword,
    deleteAdminUser,
    getAdminNav,
    createNav,
    updateNav,
    deleteNav,
    createManualNotice,
    updateManualNotice,
    deleteManualNotice,
    getAdminRedemptions,
    getAdminMessages,
    updateMessage,
    deleteMessage,
    updateReply,
    deleteReply
};
