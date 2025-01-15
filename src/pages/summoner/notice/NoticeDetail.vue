<template>
    <div class="notice_detail">
        <div class="notice_title">{{ 'xxx' }}</div>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { summpnerStore } from '@/stores/summoner.js'
import { useRoute, useRouter } from 'vue-router';
import { getNoticeFn, getNoticesActivityFn } from '@/services/summonerServices/summonerServices.js';
import { ElMessage } from 'element-plus';

const noticeDetail = ref({});
onMounted(() => {
    console.log('onMounted--',summpnerStore.noticeDetail );
})
</script>

<style></style>
