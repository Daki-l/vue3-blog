import http from '@/utils/axios';

/**
 * 兑换码列表 -> {list: [{code, content, status, source, url, created_at}], updateTime}
 */
async function getCoupons() {
    return http.get('/coupons');
}

export { getCoupons };
