<template>
	<div class="blog_layout_wrapper">
		<LayoutHeader></LayoutHeader>
		<div class="layout-content">
			<RouterView />
		</div>
		<LayoutFooter></LayoutFooter>
        <article class="article_advertising_right">
            <div class="item">
                <div>快来加入我们的游戏微信群，一起探讨游戏技巧，共享游戏乐趣！</div>
                <div class="img_box">
                    <img src="https://resource.boka.vc/MCP/icon_20250124.png" alt="">
                </div>
            </div>
            <div class="item">
                <div>每一份捐赠都是我坚持下去的动力，衷心感谢您的支持！</div>
                <div class="img_box">
                    <img src="https://resource.boka.vc/MCP/icon_20240124_2.png" alt="">
                </div>
            </div>
        </article>
	</div>
</template>

<script setup>
import LayoutHeader from '@/pages/layouts/GameLayoutHeader.vue';
import LayoutFooter from '@/pages/layouts/LayoutFooter.vue';
</script>

<style lang="less">
.blog_layout_wrapper {
	width: 100%;
	height: 100vh;
	display: block;
	overflow: auto;
	background-color: #f7f8fa;
	.layout-header {
	}
	.layout-content {
		height: calc(100% - var(--el-menu-horizontal-height));
		max-width: 1100px;
		margin: 0 auto;
		overflow-y: auto;
	}
	.layout-footer {
	}
}
.article_advertising_right {
    position: fixed;
    right: 2%;
    top: calc(50% - 240px);
    height: 480px;
    width: 180px;
    border: solid #333333 1px;
    padding: 10px;
    background-color: #FFFFFF;
    font-size: 14px;
    border-radius: 8px;
    .item {
        margin-top: 18px;
        &:first-child {
            margin-top: 0;
        }
    }
    .img_box {
        display: flex;
        align-items: center;
        justify-content: center;
        img {
            margin-top: 3px;
            width: 80%;
        }
    }
}
</style>