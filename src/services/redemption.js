import http from '@/utils/axios';

/**
 * 校验召唤师 {server, hiveIds: [...]} -> [{hiveid, wizardName?, retCode, retMsg}]
 */
async function checkRedemption(data) {
    return http.post('/redemptions/check', data);
}

/**
 * 批量兑换 {server, hiveIds: [...], codes: [...]} -> [{hiveid, coupon, retCode, retMsg}]
 */
async function redeemCoupons(data) {
    return http.post('/redemptions', data);
}

/**
 * 我的兑换记录 -> {list}
 */
async function getMyRedemptions() {
    return http.get('/redemptions/mine');
}

export { checkRedemption, redeemCoupons, getMyRedemptions };
