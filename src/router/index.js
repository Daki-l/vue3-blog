import { createRouter, createWebHistory } from 'vue-router';
import BlogLayout from '../pages/layouts/BlogLayout.vue';
import GameLayout from '../pages/layouts/GameLayout.vue';
import Home from '../pages/home/Home.vue';
import Article from '../pages/article/Article.vue';
import Coupon from '../pages/summoner/Coupon.vue';
import ArticleDetail from '../pages/article/ArticleDetail.vue';
import MessageBoard from '../pages/summoner/MessageBoard.vue';
import StaticInfo from '../pages/summoner/StaticInfo.vue';
import Action from '../pages/summoner/action/Action.vue';
import GameHome from '../pages/summoner/Home.vue';
import NoticeList from '../pages/summoner/notice/NoticeList.vue';
import NoticeDetail from '../pages/summoner/notice/NoticeDetail.vue';

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
        redirect: '/game/home',
        children: [
            {
                path: 'home',
                name: 'summonerHome',
                component: GameHome
            },
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
                redirect: 'info/scene',
                children: [
                    {
                        path: 'scene',
                        name: 'scene',
                        component: ArticleDetail
                    },
                    {
                        path: 'notice',
                        name: 'noticeList',
                        component: NoticeList
                    },
                    {
                        path: 'notice/detail',
                        name: 'noticeDetail',
                        component: NoticeDetail
                    },
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
