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
 * 当前登录用户 -> {user}
 */
async function me() {
    return http.get('/auth/me');
}

/**
 * 更新当前用户 {nickname?, hiveId?}
 */
async function updateMe(data) {
    return http.patch('/auth/me', data);
}

export { login, register, me, updateMe };
