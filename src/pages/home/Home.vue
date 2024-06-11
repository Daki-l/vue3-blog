<template>
    <div class="home-wrapper readView">
        <div class="home-left">
            <div class="left-list">
                <section class="section-item">
                    <div class="item-title">
                        <span>这是一个标题</span>
                    </div>
                    <div class="item-content">
                        <div>这是一段内容。。。。这是一段内容。。。。这是一段内容。。。。这是一段内容。。。。</div>
                    </div>
                    <div class="item-footer">
                        <span>这是footer</span>
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

<script>
export default {
    name: "Home"
}
</script>

<style lang="less">
.home-wrapper {
    .home-left {
        .left-list {
            .section-item {
                .item-title {}
                .item-content {}
                .item-footer {}
            }
        }
    }
    .home-right {
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