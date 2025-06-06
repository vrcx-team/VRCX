import axios from 'axios';
import { getToken, getTokenExpiration, setToken } from './auth'; // 假设有获取token的工具函数

let refreshPromise = null;

class Server {
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
                let token = getToken();
                const exp = getTokenExpiration();

                if (
                    config.url === '/login' ||
                    config.url === '/refresh-token'
                ) {
                    return config;
                }

                // token 无效，准备刷新
                if (!token || (exp && exp < Date.now() / 1000)) {
                    const baseURL = config.baseURL.replace(/\/+$/, '');

                    if (!refreshPromise) {
                        refreshPromise = axios
                            .get(`${baseURL}/refresh-token`, {
                                withCredentials: true
                            })
                            .then(({ data }) => {
                                if (data.code === 401) {
                                    throw new Error(
                                        window.$t('api.tokenExpired.message')
                                    );
                                }
                                setToken(data.data);
                                return data.data; // 返回新的 token
                            })
                            .finally(() => {
                                refreshPromise = null;
                            });
                    }

                    try {
                        token = await refreshPromise;
                    } catch (err) {
                        throw err;
                    }
                }

                if (token) {
                    config.headers['Authorization'] = `Bearer ${token}`;
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

        this.request = instance;
    }
}
const service = new Server();

export function createService(baseURL) {
    service.createService(baseURL);
}

export default function (data) {
    return service.request(data);
}
