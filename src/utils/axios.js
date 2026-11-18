import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '@/router';
import { useUserStore } from '@/stores/user';

const TOKEN_KEY = 'ln_accessToken';
const REFRESH_TOKEN_KEY = 'ln_refreshToken';

const baseURL = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8787';

// 独立实例:刷新 token 时使用,避免走拦截器造成死循环
const refreshInstance = axios.create({ baseURL, timeout: 15000 });

// 并发刷新锁:同一时刻只有一个刷新请求,其余请求等待其结果
let refreshingPromise = null;

function getAccessToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
}

function getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || '';
}

async function refreshAccessToken() {
    if (!refreshingPromise) {
        refreshingPromise = (async () => {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                throw new Error('no refresh token');
            }
            const res = await refreshInstance.post('/auth/refresh', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = res.data || {};
            if (!accessToken) {
                throw new Error('refresh failed');
            }
            localStorage.setItem(TOKEN_KEY, accessToken);
            if (newRefreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
            }
            return accessToken;
        })().finally(() => {
            refreshingPromise = null;
        });
    }
    return refreshingPromise;
}

// 最终 401:清理登录态并跳转登录页(带 redirect)
function forceLogout() {
    try {
        const userStore = useUserStore();
        userStore.clearAuth();
    } catch (e) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('ln_user');
    }
    const current = router.currentRoute.value;
    if (current.name !== 'login') {
        ElMessage.error('登录已失效，请重新登录');
        router.push({ name: 'login', query: { redirect: current.fullPath } });
    }
}

function getErrorMessage(error) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    if (message) {
        return message;
    }
    switch (status) {
        case 400:
            return '请求参数错误';
        case 403:
            return '没有权限执行该操作';
        case 404:
            return '请求的资源不存在';
        case 429:
            return '发言太频繁，请稍后再试';
        case 500:
            return '服务器内部错误，请稍后重试';
        case 502:
        case 503:
        case 504:
            return '服务不可用，请稍后重试';
        default:
            return error.code === 'ECONNABORTED'
                ? '请求超时，请稍后重试'
                : '网络请求失败，请检查网络';
    }
}

class Request {
    constructor() {
        this.baseUrl = baseURL;
        this.instance = axios.create({
            baseURL: this.baseUrl,
            timeout: 15000
        });
        this.setInterceptors(this.instance);
    }

    setInterceptors(instance) {
        // 请求拦截器:注入 Bearer token
        instance.interceptors.request.use((config) => {
            const token = getAccessToken();
            if (token && config.headers) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        });

        // 响应拦截器
        instance.interceptors.response.use(
            (res) => {
                return res.data;
            },
            async (error) => {
                const { response, config = {} } = error;
                const status = response?.status;
                const isAuthPath =
                    typeof config.url === 'string' &&
                    (config.url.includes('/auth/refresh') || config.url.includes('/auth/login'));

                // 401(非登录/刷新接口):先用 refreshToken 换新 token 并重试原请求一次
                if (status === 401 && !isAuthPath) {
                    if (!config._retried) {
                        try {
                            const token = await refreshAccessToken();
                            config._retried = true;
                            config.headers = config.headers || {};
                            config.headers['Authorization'] = `Bearer ${token}`;
                            return instance.request(config);
                        } catch (e) {
                            forceLogout();
                            return Promise.reject(e);
                        }
                    }
                    // 已重试过仍 401:清理登录态跳登录页
                    forceLogout();
                    return Promise.reject(error);
                }

                // 其余错误(含登录失败 401)展示后端 message 或默认文案
                if (!config._skipErrorToast) {
                    ElMessage.error(getErrorMessage(error));
                }
                return Promise.reject(error);
            }
        );
    }

    request(opts) {
        return this.instance.request(opts);
    }

    get(url, params, options = {}) {
        return this.instance.get(url, {
            params,
            ...options
        });
    }

    post(url, data, options = {}) {
        return this.instance.post(url, data, options);
    }

    put(url, data, options = {}) {
        return this.instance.put(url, data, options);
    }

    patch(url, data, options = {}) {
        return this.instance.patch(url, data, options);
    }

    delete(url, options = {}) {
        return this.instance.delete(url, options);
    }
}

export default new Request();
