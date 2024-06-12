import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    InternalAxiosRequestConfig,
    AxiosResponse
} from "axios"
// import { ElMessage, ElMessageBox } from "element-plus"
// import useStore from '@/store'
import constant from "./constant"

const instance: AxiosInstance = axios.create({
    baseURL: constant.baseUrl, // 替换为你的API base URL
    timeout: 10000, // 请求超时时间
    headers: {
        "Content-Type": "application/json"
    }
})

// 异步处理
instance.interceptors.request.use(
    (config: AxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = localStorage.getItem("token")
        if (token) {
            config.headers = config.headers ?? {} // 确保 headers 存在
            config.headers.Authorization = `Bearer ${token}`
        }
        return config as InternalAxiosRequestConfig
    },
    (error) => {
        // 对请求错误做些什么
        return Promise.reject(error)
    }
)

// 响应拦截器
instance.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => {
        // 对响应数据做些什么
        return response
    },
    (error) => {
        // 对响应错误做些什么
        if (error.response && error.response.status === 401) {
            // 处理未授权错误，例如重定向到登录页
            window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)

export default instance
