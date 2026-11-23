import http from '@/utils/axios';

/**
 * 自动兑换状态(仅白名单用户与管理员可用) -> {allowed} 或 {allowed, enabled, maxAccounts, accounts, codes, cells}
 * 后端未部署该接口时静默(页面据此隐藏相关区块)
 */
async function getMyAutoRedeem() {
    return http.get('/auto-redeem/mine', undefined, { _skipErrorToast: true });
}

/**
 * 开关某绑定账号的自动兑换 {enabled} -> {item}
 */
async function setAutoRedeem(bindId, enabled) {
    return http.patch(`/auto-redeem/accounts/${bindId}`, { enabled });
}

export { getMyAutoRedeem, setAutoRedeem };
