import http from '@/utils/axios';

/**
 * 统一新旧字段:
 * noticeTitle -> title, startTime, cropImage -> image_url, content -> content_html
 */
function normalizeNotice(item = {}) {
    return {
        ...item,
        noticeTitle: item.noticeTitle ?? item.title ?? '',
        startTime: item.startTime ?? item.start_time ?? '',
        cropImage: item.cropImage ?? item.image_url ?? '',
        content: item.content ?? item.content_html ?? ''
    };
}

/**
 * 公告/活动列表 type=notice|activity -> {list}
 */
async function getNotices(type) {
    const res = await http.get('/notices', { type });
    return {
        list: (res?.list || []).map(normalizeNotice)
    };
}

/**
 * 公告/活动详情
 */
async function getNoticeDetail(id) {
    const res = await http.get(`/notices/${id}`);
    return normalizeNotice(res);
}

export { getNotices, getNoticeDetail, normalizeNotice };
