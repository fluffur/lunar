import axios from "axios";
import {useSessionStore} from "./stores/sessionStore.ts";
import {API_BASE_URL} from "./config.ts";
import {AuthApi, ChatApi, MessageApi, UserApi} from "../api";

export const api = axios.create({
    baseURL: API_BASE_URL + '/api',
    headers: {'Content-Type': 'application/json'},
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const token = useSessionStore.getState().token;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config;
    },
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            originalRequest.url !== '/auth/refresh' &&
            originalRequest.url !== '/auth/login' &&
            originalRequest.url !== '/auth/register'
        ) {
            originalRequest._retry = true;
            try {
                const {data} = await authApi.authRefreshPost();
                const newToken = data.data.accessToken;
                useSessionStore.getState().setToken(newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                useSessionStore.getState().logout();
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const authApi = new AuthApi(undefined, undefined, api)
export const userApi = new UserApi(undefined, undefined, api)
export const messageApi = new MessageApi(undefined, undefined, api)
export const chatApi = new ChatApi(undefined, undefined, api)