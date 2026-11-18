import { createRouter, createWebHistory } from 'vue-router';
import { ElMessage } from 'element-plus';
import BlogLayout from '../pages/layouts/BlogLayout.vue';
import GameLayout from '../pages/layouts/GameLayout.vue';
import Home from '../pages/home/Home.vue';
import Article from '../pages/article/Article.vue';
import Coupon from '../pages/summoner/Coupon.vue';
import ArticleDetail from '../pages/article/ArticleDetail.vue';
import MessageBoard from '../pages/summoner/MessageBoard.vue';
import StaticInfo from '../pages/summoner/StaticInfo.vue';
import Admin from '../pages/admin/Admin.vue';
import Login from '../pages/auth/Login.vue';
import GameHome from '../pages/summoner/Home.vue';
import NoticeList from '../pages/summoner/notice/NoticeList.vue';
import NoticeDetail from '../pages/summoner/notice/NoticeDetail.vue';
import { useUserStore } from '@/stores/user';

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
                path: 'admin',
                name: 'admin',
                component: Admin,
                meta: { auth: true, admin: true }
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
                    }
                ]
            }
        ]
    },
    {
        // 登录/注册入口(独立页,不带站点头,无需登录)
        path: '/game/login',
        name: 'login',
        component: Login,
        meta: { layout: 'auth' }
    }
];

const ENV = import.meta.env;

const router = createRouter({
    history: createWebHistory(ENV.BASE_URL),
    routes: routes
});

// 全局路由守卫
router.beforeEach((to) => {
    const userStore = useUserStore();
    // 需要登录的页面:未登录跳转登录页并携带 redirect
    if (to.meta.auth && !userStore.isLogged) {
        return {
            name: 'login',
            query: { redirect: to.fullPath }
        };
    }
    // 管理员页面:非管理员跳回游戏首页并提示
    if (to.meta.admin && !userStore.isAdmin) {
        ElMessage.warning('该页面仅管理员可访问');
        return '/game/home';
    }
    // 已登录用户访问登录页:直接回首页
    if (to.name === 'login' && userStore.isLogged) {
        return '/game/home';
    }
    return true;
});

export default router;
