<template>
    <div class="notice_detail" v-loading="onLoading">
        <div class="notice_content" v-html="noticeDetail && noticeDetail.content"></div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { summpnerStore } from '@/stores/summoner.js'
import { useRoute, useRouter } from 'vue-router';
import { getNoticeFn, getNoticesActivityFn } from '@/services/summonerServices/summonerServices.js';
import { ElMessage } from 'element-plus';

let router = useRouter();
const noticeDetail = ref({});
const onLoading = ref(false)
onMounted(() => {
    if (summpnerStore.noticeDetail?.content) {
        onLoading.value = true;
        noticeDetail.value = summpnerStore.noticeDetail
        setTimeout(() => {
            onLoading.value = false;
        }, 300);
    } else {
        router.push({ name: 'summonerHome' })
    }
})
</script>

<style lang="less">
.notice_detail {
    background-color: #FFFFFF;
    padding: 10px 24px;
    height: 100%;
    img {
        width: 100%;
    }
}
</style>
