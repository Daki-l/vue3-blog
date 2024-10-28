<template>
    <section class="article-card">
        <div class="item-img ">
            <div class="img-wrapper">
                <img :src="articleInfo.cover && articleInfo.cover.path || defaultListImg" alt="">
            </div>
        </div>
        <div class="item-content">
            <div class="content-top">
                <span class="info-time">
                    <i class="iconfont icon-date"></i>
                    <span>{{ moment(new Date(articleInfo.createDate)).format('YYYY-MM-DD') }}</span>
                    <span>{{  articleInfo.subTitle }}</span>
                </span>    
            </div>
            <div class="info-title">{{ articleInfo.title }}</div>
            <div class="info-text">{{ articleInfo.intro }}</div>
            <div class="content-footer">
                <div class="footer-left tag-list">
                    <el-tag class="tag-item" type="primary" v-for="(tag, i) in articleInfo.tags.split(',').filter((e) => e)" :key="i">{{ tag }}</el-tag>
                </div>
                <div class="footer-right">
                    <el-button class="btn-more" @click="gotoActicleDetail">更多</el-button>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref } from 'vue';
import moment from "moment";
import constant from "@/common/constant";
import router from '@/router';

const defaultListImg = constant.defaultListImg;
const props = defineProps({
    cardInfo: Object
});

const articleInfo= ref(props.cardInfo)

function gotoActicleDetail() {
    let { id, status } = articleInfo;
    router.push({
        name: 'articelDetail',
        query: { id, status}
    });
}

</script>

<style scoped lang="less">
.article-card {
    width: 100%;
    height: 212px;
    // border: solid 1px red;
    border-radius: 8px 8px 16px 8px;
    margin-top: 20px;
    margin-left: 8px;
    box-shadow: 0 0 8px var(--box-bg-shadow);
    // border: solid 1px var(--grey-3);
    overflow: hidden;
    .item-img {
        width: 50%;
        height: 100%;
        padding-right: 24px;
        float: left;
        .img-wrapper {
            width: 100%;
            height: 100%;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            // background-color: #f0f0f0;
            img {
                height: 100%;
            }
        }
    }
    .item-content {
        width: 50%;
        // padding: 16px 24px 48px 0;
        float: right;
        display: flex;
        flex-direction: column;
        .content-top {
            text-align: right;
            height: 26px;
            margin-top: 16px;
            margin-right: 24px;
            .info-time {}
        }
        .info-title {
            color: #E9546B;
            font-size: 18px;
            line-height: 28px;
            padding: 10px 0;
            margin-right: 24px;
        }
        .info-text {
            height: 80px;
            color: #3D3D3D;
            margin-right: 24px;
        }
        .content-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 40px;
            .footer-left {
                color: #A3A3A3;
                .tag-item {
                    font-size: 14px;
                    margin-right: 4px;
                }
            }
            .footer-right {
                .btn-more {
                    padding: 4.8px 16px;
                    border-radius: 16px 0;
                    color: var(--grey-0);
                    vertical-align: -11px;
                    background-image: linear-gradient(to right, var(--color-pink) 0, var(--color-orange) 100%);
                    &:active {
                        border: none;
                    }
                }
            }
        }
    }
}
</style>