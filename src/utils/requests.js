import axios from 'axios';
import { getToken, getTokenExpiration, setToken } from './auth'; // 假设有获取token的工具函数

// 创建axios实例
const service = {
    createService(baseURL) {
        const instance = axios.create({
            baseURL: baseURL, // API的基础URL
            timeout: 5000, // 请求超时时间
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true // 允许携带cookie
        });

        // 请求拦截器
        instance.interceptors.request.use(
            async (config) => {
                let token = getToken(); // 获取token
                const exp = getTokenExpiration(); // 获取token过期时间
                console.log('请求拦截器', token, exp);
                if (config.url === '/login'){
                    return config; // 如果是登录请求，不添加token
                }
                // token 过期或则token为空则刷新token
                if (!token || (exp && exp < Date.now() / 1000)) {
                    // 删除 baseURL 后面所有的斜杠
                    const baseURL = config.baseURL.replace(/\/+$/, '');
                    const { code, data } = await axios.get(
                        `${baseURL}/refresh-token`,
                        {
                            withCredentials: true
                        }
                    );
                    if (code === 401) {
                        throw new Error(window.$t('api.tokenExpired.message'));
                    }
                    setToken(data.data);
                    token = data.data; // 更新token
                }
                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`; // 设置Authorization头
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // 响应拦截器
        instance.interceptors.response.use(
            (response) => {
                return response.data; // 返回响应数据
            },
            (error) => {
                return Promise.reject(error?.response?.data || error.message);
            }
        );

        return instance;
    }
};

export default service;
