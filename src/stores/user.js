import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import * as authService from '@/services/auth';

const TOKEN_KEY = 'ln_accessToken';
const REFRESH_TOKEN_KEY = 'ln_refreshToken';
const USER_KEY = 'ln_user';

function readJSON(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {
        return null;
    }
}

export const useUserStore = defineStore('user', () => {
    const accessToken = ref(localStorage.getItem(TOKEN_KEY) || '');
    const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) || '');
    const user = ref(readJSON(USER_KEY));

    const isLogged = computed(() => !!accessToken.value);
    const isAdmin = computed(() => user.value?.role === 'admin');
    const displayName = computed(() => user.value?.nickname || user.value?.username || '');

    function setTokens(accessTokenVal, refreshTokenVal) {
        accessToken.value = accessTokenVal || '';
        refreshToken.value = refreshTokenVal || '';
        if (accessTokenVal) {
            localStorage.setItem(TOKEN_KEY, accessTokenVal);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
        if (refreshTokenVal) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenVal);
        } else {
            localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
    }

    function setUser(userVal) {
        user.value = userVal || null;
        if (userVal) {
            localStorage.setItem(USER_KEY, JSON.stringify(userVal));
        } else {
            localStorage.removeItem(USER_KEY);
        }
    }

    function clearAuth() {
        setTokens('', '');
        setUser(null);
    }

    async function login(payload) {
        const res = await authService.login(payload);
        setTokens(res.accessToken, res.refreshToken);
        setUser(res.user);
        return res;
    }

    async function register(payload) {
        const res = await authService.register(payload);
        if (res?.accessToken) {
            setTokens(res.accessToken, res.refreshToken);
            setUser(res.user);
        }
        return res;
    }

    async function fetchMe() {
        const res = await authService.me();
        setUser(res.user);
        return res.user;
    }

    async function refreshUser() {
        return fetchMe();
    }

    async function updateMe(payload) {
        const res = await authService.updateMe(payload);
        if (res?.user) {
            setUser(res.user);
        }
        return res;
    }

    function logout() {
        clearAuth();
    }

    return {
        accessToken,
        refreshToken,
        user,
        isLogged,
        isAdmin,
        displayName,
        setTokens,
        setUser,
        clearAuth,
        login,
        register,
        logout,
        fetchMe,
        refreshUser,
        updateMe
    };
});
