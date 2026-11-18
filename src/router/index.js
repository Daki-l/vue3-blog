import { createRouter, createWebHistory } from 'vue-router';
import { ElMessage } from 'element-plus';
import GameLayout from '../pages/layouts/GameLayout.vue';
import GameHome from '../pages/summoner/Home.vue';
import ArticleDetail from '../pages/article/ArticleDetail.vue';
import Coupon from '../pages/summoner/Coupon.vue';
import MessageBoard from '../pages/summoner/MessageBoard.vue';
import StaticInfo from '../pages/summoner/StaticInfo.vue';
import Login from '../pages/auth/Login.vue';
import Profile from '../pages/profile/Profile.vue';
import NotFound from '../pages/NotFound.vue';
import NoticeList from '../pages/summoner/notice/NoticeList.vue';
import NoticeDetail from '../pages/summoner/notice/NoticeDetail.vue';
import AdminLayout from '../pages/admin/AdminLayout.vue';
import AdminDashboard from '../pages/admin/Dashboard.vue';
import AdminCoupons from '../pages/admin/Coupons.vue';
import AdminArticles from '../pages/admin/Articles.vue';
import AdminUsers from '../pages/admin/Users.vue';
import AdminNav from '../pages/admin/NavManage.vue';
import AdminNotices from '../pages/admin/Notices.vue';
import AdminRedemptions from '../pages/admin/Redemptions.vue';
import AdminMessages from '../pages/admin/Messages.vue';
import { useUserStore } from '@/stores/user';

// v2 扁平路由:全部一级路径,GameLayout 作为布局壳(子路由使用绝对路径)
const routes = [
    {
        path: '/',
        component: GameLayout,
        children: [
            {
                path: '',
                redirect: '/home'
            },
            {
                path: '/home',
                name: 'home',
                component: GameHome
            },
            {
                path: '/info/scene',
                name: 'scene',
                component: ArticleDetail
            },
            {
                path: '/notice',
                name: 'noticeList',
                component: NoticeList
            },
            {
                path: '/notice/detail',
                name: 'noticeDetail',
                component: NoticeDetail
            },
            {
                path: '/coupon',
                name: 'coupon',
                component: Coupon
            },
            {
                path: '/message',
                name: 'message',
                component: MessageBoard
            },
            {
                // 旧静态下载页保留(不在导航中展示)
                path: '/static',
                name: 'static',
                component: StaticInfo
            },
            {
                path: '/profile',
                name: 'profile',
                component: Profile,
                meta: { auth: true }
            },
            {
                // 管理中心:子页共用 AdminLayout(左侧菜单 + 右侧 router-view)
                path: '/admin',
                name: 'admin',
                component: AdminLayout,
                redirect: '/admin/dashboard',
                meta: { auth: true, admin: true },
                children: [
                    {
                        path: 'dashboard',
                        name: 'adminDashboard',
                        component: AdminDashboard,
                        meta: { auth: true, admin: true }
                    },
                    {
                        path: 'coupons',
                        name: 'adminCoupons',
                        component: AdminCoupons,
                        meta: { auth: true, admin: true }
                    },
                    {
                        path: 'articles',
                        name: 'adminArticles',
                        component: AdminArticles,
                        meta: { auth: true, admin: true }
                    },
                    {
                        path: 'users',
                        name: 'adminUsers',
                        component: AdminUsers,
                        meta: { auth: true, admin: true }
                    },
                    {
                        path: 'nav',
                        name: 'adminNav',
                        component: AdminNav,
                        meta: { auth: true, admin: true }
                    },
                    {
                        path: 'notices',
                        name: 'adminNotices',
                        component: AdminNotices,
                        meta: { auth: true, admin: true }
                    },
                    {
                        path: 'redemptions',
                        name: 'adminRedemptions',
                        component: AdminRedemptions,
                        meta: { auth: true, admin: true }
                    },
                    {
                        path: 'messages',
                        name: 'adminMessages',
                        component: AdminMessages,
                        meta: { auth: true, admin: true }
                    }
                ]
            },
            {
                // 未匹配路径:404 页(仍带站点头布局)
                path: '/:pathMatch(.*)*',
                name: 'notFound',
                component: NotFound
            }
        ]
    },
    {
        // 登录/注册入口(独立页,不带站点头,无需登录)
        path: '/login',
        name: 'login',
        component: Login
    },
    // ===== 旧路径兼容重定向(保住旧书签) =====
    {
        // 旧博客模块任意路径 -> 首页(丢弃无用 query)
        path: '/blog',
        redirect: () => '/'
    },
    {
        path: '/blog/:pathMatch(.*)*',
        redirect: () => '/'
    },
    {
        // 旧游戏页前缀:strip /game 前缀(含 /game/info/scene?id=x 等)
        path: '/game',
        redirect: '/home'
    },
    {
        path: '/game/:legacyPath(.*)',
        redirect: (to) => {
            const target = String(to.params.legacyPath || '').replace(/^\/+/, '');
            return {
                path: `/${target}`,
                query: to.query
            };
        }
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
    // 需要登录的页面:未登录跳转登录页并携带 redirect(兼容 /game/* 旧路径,重定向规则会自动转换)
    if (to.meta.auth && !userStore.isLogged) {
        return {
            name: 'login',
            query: { redirect: to.fullPath }
        };
    }
    // 管理员页面:非管理员跳回首页并提示
    if (to.meta.admin && !userStore.isAdmin) {
        ElMessage.warning('该页面仅管理员可访问');
        return '/home';
    }
    // 已登录用户访问登录页:直接回首页
    if (to.name === 'login' && userStore.isLogged) {
        return '/home';
    }
    return true;
});

export default router;
