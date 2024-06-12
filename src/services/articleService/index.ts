import axios from "@/utils/axios"
import constant from "@/utils/constant"

const baseUrl = `${constant.baseUrl}`

async function getArticleList() {
    return axios.get(`${baseUrl}/v1/acticle/list`)
}

export default {
    getArticleList
}
