import http from '@/utils/axios';

/**
 * 公开导航列表 -> {list:[{id,parentId,name,path,sort}]}(仅 visible=1)
 */
async function getNav() {
    return http.get('/nav');
}

export { getNav };
