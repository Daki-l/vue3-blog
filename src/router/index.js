import { createRouter, createWebHistory } from 'vue-router';
import BlogLayout from '../pages/layouts/BlogLayout.vue';
import GameLayout from '../pages/layouts/GameLayout.vue';
import Home from '../pages/home/Home.vue';
import Article from '../pages/article/Article.vue';
import Coupon from '../pages/coupon/Coupon.vue';
import ArticleDetail from '../pages/article/ArticleDetail.vue';
import MessageBoard from '../pages/summoner/MessageBoard.vue';
import StaticInfo from '../pages/summoner/StaticInfo.vue';
import Action from '../pages/summoner/Action.vue';

let routes = [
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
            },
            {
                path: 'static',
                name: 'static',
                component: StaticInfo
            },
            {
                path: 'info',
                name: 'info',
                redirect: 'info/giant',
                children: [
                    {
                        path: 'scene',
                        name: 'scene',
                        component: ArticleDetail
                    }
                ]
            }
        ]
    }
];
let ENV = import.meta.env;
if (ENV.MODE === "development") {
    routes.forEach(e => {
        if (e.name === 'game') {
            e.children.push({
                path: 'action',
                name: 'action',
                component: Action
            },)
        }
    })
}
const router = createRouter({
    history: createWebHistory(ENV.BASE_URL),
    routes: routes
});

export default router;
