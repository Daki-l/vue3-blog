import { createRouter, createWebHistory } from 'vue-router';
import BlogLayout from '../pages/layouts/BlogLayout.vue';
import GameLayout from '../pages/layouts/GameLayout.vue';
import Home from '../pages/home/Home.vue';
import Article from '../pages/article/Article.vue';
import Coupon from '../pages/coupon/Coupon.vue';
import ArticleDetail from '../pages/article/ArticleDetail.vue';
import MessageBoard from '../pages/summoner/MessageBoard.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/blog/home'
        },
        {
            path: '/blog',
            name: 'blog',
            component: BlogLayout,
            children: [
                {
                    path: 'home',
                    name: 'home',
                    component: Home
                },
                {
                    path: 'article',
                    name: 'article',
                    component: Article
                },
                {
                    path: 'article/detail',
                    name: 'articelDetail',
                    component: ArticleDetail
                }
            ]
        },
        {
            path: '/game',
            name: 'game',
            component: GameLayout,
            redirect: '/game/coupon',
            children: [
                {
                    path: 'coupon',
                    name: 'coupon',
                    component: Coupon
                },
                {
                    path: 'message',
                    name: 'message',
                    component: MessageBoard
                }
            ]
        }
    ]
});

export default router;
