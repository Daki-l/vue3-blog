import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getNav } from '@/services/nav';

/**
 * 默认导航(回退常量):与 seed-nav.sql 种子数据保持一致的扁平路径。
 * 接口 /nav 不可用时使用,保证站点始终可导航。
 */
export const DEFAULT_NAV_ITEMS = [
    { id: 1, parentId: null, name: '首页', path: '/home', sort: 1 },
    { id: 2, parentId: null, name: '地下城介绍', path: '', sort: 2 },
    { id: 21, parentId: 2, name: '巨人地下城', path: '/info/scene?id=11', sort: 1 },
    { id: 22, parentId: 2, name: '龙之地下城', path: '/info/scene?id=12', sort: 2 },
    { id: 23, parentId: 2, name: '死亡地下城', path: '/info/scene?id=13', sort: 3 },
    { id: 24, parentId: 2, name: '精灵地下城', path: '/info/scene?id=14', sort: 4 },
    { id: 25, parentId: 2, name: '钢铁地下城', path: '/info/scene?id=15', sort: 5 },
    { id: 26, parentId: 2, name: '惩罚者地下城', path: '/info/scene?id=16', sort: 6 },
    { id: 3, parentId: null, name: '公告', path: '/notice', sort: 3 },
    { id: 4, parentId: null, name: '兑换码直兑', path: '/coupon', sort: 4 },
    { id: 5, parentId: null, name: '留言板', path: '/message', sort: 5 }
];

function isEmptyParent(parentId) {
    return parentId === null || parentId === undefined || parentId === 0 || parentId === '0';
}

/**
 * 扁平列表 -> 两级树(顶级按 sort,子级挂 parentId 后按 sort)
 */
function buildTree(list) {
    const items = (list || [])
        .filter((item) => item && item.name)
        .map((item) => ({
            id: item.id,
            parentId: isEmptyParent(item.parentId) ? null : Number(item.parentId),
            name: item.name,
            path: item.path || '',
            sort: Number(item.sort) || 0
        }));
    const byId = new Map(items.map((item) => [item.id, { ...item, children: [] }]));
    const roots = [];
    byId.forEach((node) => {
        const parent = node.parentId != null ? byId.get(node.parentId) : null;
        if (parent && parent !== node) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });
    const byOrder = (a, b) => a.sort - b.sort || a.id - b.id;
    roots.sort(byOrder);
    roots.forEach((root) => root.children.sort(byOrder));
    return roots;
}

export const useNavStore = defineStore('nav', () => {
    const tree = ref([]);
    const loaded = ref(false);
    let initPromise = null;

    async function init() {
        if (!initPromise) {
            initPromise = (async () => {
                try {
                    const res = await getNav();
                    const list = (res?.list || []).length > 0 ? res.list : DEFAULT_NAV_ITEMS;
                    tree.value = buildTree(list);
                } catch (e) {
                    // 接口失败(如后端未就绪):回退默认常量,不弹错误提示
                    tree.value = buildTree(DEFAULT_NAV_ITEMS);
                } finally {
                    loaded.value = true;
                }
            })();
        }
        return initPromise;
    }

    // 管理端改动导航后调用,重新拉取
    async function refresh() {
        initPromise = null;
        return init();
    }

    function useDefault() {
        tree.value = buildTree(DEFAULT_NAV_ITEMS);
        loaded.value = true;
    }

    return { tree, loaded, init, refresh, useDefault };
});
