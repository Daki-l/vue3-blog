<template>
    <div class="home-wrapper readView">
        <div class="home-left">
            <div class="left-top">
                <i>通知</i>
                <span class="top-text">这是一条通知消息</span>
                <i>>></i>
            </div>
            <div class="left-list">
                <section class="section-item" v-for="(item, index) in swiperList" :key="index">
                    <div class="item-img ">
                        <img :src="item.cover && item.cover.path || defaultListImg" alt="">
                    </div>
                    <div class="item-content ">
                        <div class="content-title">{{ item.title }}</div>
                        <div class="content-text">{{ item.intro }}</div>
                        <div class="content-footer">
                            <div class="footer-left"></div>
                            <div class="footer-right">
                                <el-button>更多</el-button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div> 
        <div class="home-right">
            <article class="right-info">
                <section class="section-item">
                    <div class="item-title">公告</div>
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
import { ref } from 'vue';

const defaultListImg = 'https://static.lnow.site/246774fc42d96f6183b2d815935e93448311db6'

const swiperList = ref([{"id":3,"title":"xsx","subTitle":"xsx","tags":",xsx,","cover":null,"intro":"xsx","pubDate":"2024/06/07 14:38:11","status":1,"createDate":"2024/06/07 14:38:11"},{"id":2,"title":" MarkDown","subTitle":"MarkDown","tags":",MarkDown,","cover":null,"intro":"MarkDown","pubDate":"2024/06/07 14:34:29","status":1,"createDate":"2024/06/07 14:34:29"},{"id":1,"title":"test","subTitle":"test","tags":",test,","cover":{"id":4,"path":"https://static.lnow.site/922038cc9d63921e41afb57d58deed5394d984ae","thumb":"https://static.lnow.site/922038cc9d63921e41afb57d58deed5394d984ae/thumb","hash":"922038cc9d63921e41afb57d58deed5394d984ae","width":280,"height":280,"size":18663,"color":"#c3d2e0","from":1,"createDate":"2024/06/12 17:45:44"},"intro":"test","pubDate":"2024/06/07 10:34:52","status":1,"createDate":"2024/06/07 10:34:52"}]);

</script>

<style lang="less">
.home-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
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
                font-size: 14px;
            }
        }
        .left-list {
            .section-item {
                width: 100%;
                height: 224px;
                // border: solid 1px red;
                border-radius: 8px;
                margin-top: 20px;
                margin-left: 8px;
                box-shadow: 10px 30px -15px var(--box-bg-shadow);
                border: solid 1px var(--grey-3);
                overflow: hidden;
                .item-img {
                    width: 50%;
                    float: left;
                    overflow: hidden;
                    img {
                        height: 100%;
                    }
                }
                .item-content {
                    width: 50%;
                    float: left;
                    display: flex;
                    flex-direction: column;
                    .content-title {}
                    .content-content {}
                    .content-footer {}
                }
            }
        }
    }
    .home-right {
        width: 18%;
        margin-left: 24px;
        .right-info {
            .section-item {
                .item-title {}
                .item-content {}
                .item-footer {}
            }
        }
    }
}
</style>