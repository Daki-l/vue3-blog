//存放请求路径的文件
import constant from "./constant"
import type {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig
} from "axios"
import { ElMessage } from "element-plus"
import axios from "axios"
import router from "@/router"
class Request {
    private baseUrl: string = constant.baseUrl

    private request(opts: {}) {
        const instance: AxiosInstance = axios.create({
            baseURL: this.baseUrl,
            timeout: 6000
        })
        this.setInterceptors(instance)
        return instance(opts)
    }
    //拦截器
    private setInterceptors(instance: AxiosInstance) {
        //请求拦截器
        instance.interceptors.request.use(
            (config: AxiosRequestConfig): InternalAxiosRequestConfig => {
                const token = localStorage.getItem("token")
                if (token && config.headers) {
                    config.headers["Authorization"] = token
                }
                return config as InternalAxiosRequestConfig
            }
        )
        //响应拦截器
        instance.interceptors.response.use(
            (res: AxiosResponse) => {
                if (res.status == 200) {
                    return Promise.resolve(res.data)
                } else {
                    return Promise.reject(res.data)
                }
            },
            (err) => {
                let instance: any = null
                switch (err.response.status) {
                    case 401:
                        instance = ElMessage.error("用户信息过期，请重新登录")
                        setTimeout(() => {
                            instance.close()
                            router.push("/home")
                        }, 1000)
                        break
                    default:
                        console.warn(`status= ${status}`)
                        break
                }
                return Promise.reject(err)
            }
        )
    } //封装get请求
    public get(url: string, options?: AxiosRequestConfig) {
        return this.request({
            url: url,
            method: "get",
            params: options
        })
    } //封装post请求
    public post(url: string, options: AxiosRequestConfig) {
        return this.request({
            url: url,
            method: "post",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: options
        })
    }
}
const httpRequest = new Request()
export default httpRequest
