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
async function getSummonerCode() {
    return axios.get('summoner/code');
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
 * 兑换兑换码到召唤师
 */
async function setCodeToUser(params) {
    let paramsText = new URLSearchParams(params).toString();
    return axios.post('summoner/server/useCoupon', paramsText);
}



export {
    getSummonerCode,
    updateSummonerCode,
    getSummonerUserInfo,
    setCodeToUser
};