<template>
    <div class="home-wrapper readView">
        <div class="home-left">
            <div class="left-top">
                <i class="iconfont icon-notice1"></i>
                <span class="top-text">这是一条通知消息</span>
                <i>>></i>
            </div>
            <div class="left-list">
                <ArticleCard
                    v-for="(item, index) in swiperList" :key="index"
                    :card-info="item"
                ></ArticleCard>
            </div>
        </div> 
        <div class="home-right">
            <article class="right-info">
                <section class="section-item announcement">
                    <div class="item-title">
                        <i class="iconfont icon-gonggao"></i>
                        <span>公告</span>
                    </div>
                    <div class="item-content">
                        <span>公告内容</span>
                    </div>
                </section>
                <section class="section-item">
                    <div class="item-title">分类</div>
                    <div class="item-content">
                        <span>分类1</span>
                        <span>分类2</span>
                        <span>分类3</span>
                        <span>分类4</span>
                    </div>
                </section>
                <section class="section-item">
                    <div class="item-title">标签</div>
                    <div class="item-content">
                        <span>标签1</span>
                        <span>标签2</span>
                        <span>标签3</span>
                        <span>标签4</span>
                    </div>
                </section>
            </article>    
        </div> 
    </div>
</template>

<script setup lang="ts">
import moment from "moment";
import { ref } from 'vue';
import { onMounted } from 'vue';
import { getArticleList } from '@/services/articleService';
import ArticleCard from "@/components/ArticleCard.vue"


onMounted(() => {
    init();
});

function init () {
    initList();
}

const swiperList = ref<Array<any>>([]);
interface requestType {
    list: any,
    total: number
}
function  initList() {
    getArticleList().then((res) => {
        let { list } = res as requestType;
        swiperList.value = list;
	});
}

</script>

<style lang="less">
.home-wrapper {
    // width: calc(100% - 88px);
    display: flex;
    background-color: var(--comment-color);
    .home-left {
        width: calc(100% - 18% - 24px);
        .left-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: 45px;
            border: solid 1px #f1f1f1;
            box-shadow: 10px 30px -15px var(--box-bg-shadow);
            .top-text {
                font-size: 16px;
            }
        }
        .left-list {}
    }
    .home-right {
        width: 18%;
        margin-left: 24px;
        .right-info {
            .section-item {
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 0 8px var(--box-bg-shadow);
                transition: all .2s ease-in-out 0s;
                margin-bottom: 20px;
                .item-title {
                }
                .item-content {}
                .item-footer {}
                &.announcement {
                    .item-title {
                        font-size: 18px;
                        .iconfont {
                            font-size: 16px;
                            color: #FF3E3E;
                            margin-right: 8px;
                        }
                    }
                }
            }
        }
    }
}
</style>