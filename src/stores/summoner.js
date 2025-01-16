import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const summpnerStore = defineStore('summoner', () => {
    const noticeDetail = ref({});
    const noticeList = ref([]);
    const noticeActivityList = ref([]);
    const getNoticeTime = ref(0)

    return { noticeDetail, noticeList, noticeActivityList, getNoticeTime }
})
