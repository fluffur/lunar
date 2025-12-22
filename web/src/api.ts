import axios from "axios";
import {useSessionStore} from "./stores/sessionStore.ts";
import {API_BASE_URL} from "./config.ts";

export const api = axios.create({
    baseURL: API_BASE_URL +'/api',
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
                const {data} = await api.post('/auth/refresh');
                const newToken = data.accessToken;
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

