import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const summpnerStore = defineStore('summoner', () => {
    const noticeDetail = ref({});
    const noticeList = ref([]);

    return { noticeDetail }
})
