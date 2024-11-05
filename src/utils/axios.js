import constant from './constant';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import router from '@/router';

let baseURL = constant.useMock ? constant.mockUrl : constant.baseUrl;
class Request {
    baseUrl = baseURL;

    request(opts) {
        const instance = axios.create({
            baseURL: this.baseUrl,
            timeout: 6000
        });
        this.setInterceptors(instance);
        return instance(opts);
    }
    //拦截器
    setInterceptors(instance) {
        //请求拦截器
        instance.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token && config.headers) {
                config.headers['Authorization'] = token;
            }
            return config;
        });
        //响应拦截器
        instance.interceptors.response.use(
            (res) => {
                let data = res.data?.data || res.data;
                if (res.status == 200) {
                    return Promise.resolve(data);
                } else {
                    return Promise.reject(data);
                }
            },
            (err) => {
                let instance = null;
                switch (err.response?.status) {
                    case 401:
                        instance = ElMessage.error('用户信息过期，请重新登录');
                        setTimeout(() => {
                            instance.close();
                            router.push('/home');
                        }, 1000);
                        break;
                    case 500:
                        instance = ElMessage.error('服务器请求错误！');
                        setTimeout(() => {
                            instance.close();
                        }, 1000);
                        break;
                    default:
                        ElMessage.error('请求错误！');
                        break;
                }
                return Promise.reject(err);
            }
        );
    }
    //封装get请求
    get(url, options) {
        return this.request({
            url: url,
            method: 'get',
            params: options
        });
    }
    //封装post请求
    post(url, options) {
        return this.request({
            url: url,
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: options
        });
    }
    //封装put请求
    put(url, options) {
        return this.request({
            url: url,
            method: 'put',
            data: options
        });
    }
    //封装put请求
    delete(url) {
        return this.request({
            url: url,
            method: 'delete'
        });
    }
}
export default new Request();
