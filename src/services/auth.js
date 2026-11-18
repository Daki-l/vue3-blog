import http from '@/utils/axios';

/**
 * 登录 {username, password} -> {accessToken, refreshToken, user}
 */
async function login(data) {
    return http.post('/auth/login', data);
}

/**
 * 注册 {username, password, nickname?} -> {user}
 */
async function register(data) {
    return http.post('/auth/register', data);
}

/**
 * 当前登录用户 -> {user}(v2: user 含 hiveIds 数组)
 */
async function me() {
    return http.get('/auth/me');
}

/**
 * 更新当前用户 {nickname?} -> {user}
 */
async function updateMe(data) {
    return http.patch('/auth/me', data);
}

/**
 * 修改密码 {oldPassword, newPassword} -> {accessToken, refreshToken}
 */
async function changePassword(data) {
    return http.patch('/auth/password', data);
}

/**
 * 我的 Hive 账号列表 -> {list:[{id,hiveId,server,label,createdAt}]}
 */
async function getHiveIds() {
    return http.get('/auth/hive-ids');
}

/**
 * 新增 Hive 账号 {hiveId, server, label?} -> {item}
 */
async function addHiveId(data) {
    return http.post('/auth/hive-ids', data);
}

/**
 * 删除 Hive 账号 -> {success:true}
 */
async function deleteHiveId(id) {
    return http.delete(`/auth/hive-ids/${id}`);
}

export { login, register, me, updateMe, changePassword, getHiveIds, addHiveId, deleteHiveId };
