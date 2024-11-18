// import { METHOD, request } from "@/utils/request";
// import constant from "@/utils/constant";

import axios from '@/utils/axios';
// import constant from '@/utils/constant';

// const baseUrl = `${constant.baseUrl}`;

// async function getArticleList() {
//     return axios.get(`article/v1/list`);
// }

// const baseUrl = `${constant.apiURl}/summoner`;

/**
 * 获取最新兑换码
 */
async function getSummonerCode(params) {
    return axios.get('summoner/code/getCode', params);
}

/**
 *更新兑换码
 */
async function updateSummonerCode(params) {
    return axios.post('summoner/code/updateCode', params);
}


/**
 * 获取召唤师信息
 */
async function getSummonerUserInfo(params) {
    let paramsText = new URLSearchParams(params).toString();
    return axios.post('summoner/server/checkUser', paramsText);
}

/**
 * 获取召唤师信息
 */
async function getUserInfoList(params) {
    return axios.post('summoner/server/checkUsers', params);
}


/**
 * 兑换兑换码到召唤师
 */
async function setCodeToUser(params) {
    let paramsText = new URLSearchParams(params).toString();
    return axios.post('summoner/server/useCoupon', paramsText);
}

/**
 * 批量兑换兑换码到召唤师
 */
async function setCodeToUsers(params) {
    return axios.post('summoner/server/useCoupons', params);
}


/**
 * 获取留言列表
 */
async function getMessageList(params) {
    return axios.get('summoner/message/getMessages', params);
}

/**
 * 新增留言
 */
async function addMessageFn(params) {
    return axios.post('summoner/message/addMessage', params);
}

/**
 * 新增回复
 */
async function addReplyFn(params) {
    return axios.post('summoner/reply/addReply', params);
}


export {
    getSummonerCode,
    updateSummonerCode,
    getSummonerUserInfo,
    getUserInfoList,
    setCodeToUser,
    setCodeToUsers,
    getMessageList,
    addMessageFn,
    addReplyFn
};