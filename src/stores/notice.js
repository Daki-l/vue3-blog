import { ref } from 'vue';
import { defineStore } from 'pinia';

/**
 * 公告/活动列表与详情的内存缓存(替代旧 summoner store)
 */
export const useNoticeStore = defineStore('notice', () => {
    const noticeDetail = ref(null);
    const noticeList = ref([]);
    const noticeActivityList = ref([]);
    const getNoticeTime = ref(0);

    function reset() {
        noticeDetail.value = null;
        noticeList.value = [];
        noticeActivityList.value = [];
        getNoticeTime.value = 0;
    }

    return { noticeDetail, noticeList, noticeActivityList, getNoticeTime, reset };
});
