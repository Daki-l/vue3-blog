import axios from '@/utils/axios';

/**
 * 获取最新兑换码
 */
async function getSummonerCode(params) {
    return axios.get('summoner/code/getCode', params);
}

/**
 *更新兑换码
 coupon, content, status
 */
async function updateSummonerCodeFn(params) {
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
 * 更新留言
 * @param {string} params messageId
 * @param {string} params nickname
 * @param {string} params content
 * @returns 
 */
async function updateMessageFn(params) {
    return axios.post('summoner/message/updateMessage', params)
}


/**
 * 删除留言
 * @param {string} params messageId
 * @returns 
 */
async function deleteMessageFn(params) {
    return axios.post('summoner/message/deleteMessage', params)
}

/**
 * 新增回复
 */
async function addReplyFn(params) {
    return axios.post('summoner/reply/addReply', params);
}

/**
 * 更新回复
 * @param {string} params messageId
 * @param {string} replyId replyId
 * @param {string} params nickname
 * @param {string} params content
 * @returns 
 */
async function updateReplyFn(params) {
    return axios.post('summoner/reply/updateReply', params)
}

/**
 * 删除回复
 * @param {string} params messageId
 * @param {string} params replyId
 * @returns 
 */
async function deleteReplyeFn(params) {
    return axios.post('summoner/reply/deleteReply', params)
}

/**
 * 获取公告
 * params{string} pageSize
 * params{string} pageNum
 */
async function getNoticeFn(params) {
    return axios.post('summoner/notice/getNotice?force=true', params);
}

/**
 * 获取活动
 */
async function getNoticesActivityFn(params) {
    return axios.post('summoner/notice/getNoticesActivity?force=true', params);
}




export {
    getSummonerCode,
    updateSummonerCodeFn,
    getSummonerUserInfo,
    getUserInfoList,
    setCodeToUser,
    setCodeToUsers,
    getMessageList,
    addMessageFn,
    updateMessageFn,
    deleteMessageFn,
    addReplyFn,
    updateReplyFn,
    deleteReplyeFn,
    getNoticeFn,
    getNoticesActivityFn
};