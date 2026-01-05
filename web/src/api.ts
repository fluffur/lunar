import axios from "axios";
import { useSessionStore } from "./stores/sessionStore.ts";
import { API_BASE_URL } from "./config.ts";
import { AuthApi, RoomApi, MessageApi, UserApi } from "../api";
import { router } from "./router.tsx";

export const api = axios.create({
    baseURL: API_BASE_URL + '/api',
    headers: { 'Content-Type': 'application/json' },
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

const parseJwt = (token: string) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401) {
            const message = error.response.data?.error?.message;

            if (
                !originalRequest._retry &&
                originalRequest.url !== '/auth/refresh' &&
                originalRequest.url !== '/auth/login' &&
                originalRequest.url !== '/auth/register' &&
                originalRequest.url !== '/auth/verify'
            ) {
                originalRequest._retry = true;
                try {
                    if (message?.toLowerCase() === "email is not verified") {
                        if (window.location.pathname !== '/verify') {
                            const token = useSessionStore.getState().token;
                            if (token) {
                                const claims = parseJwt(token);
                                if (claims && claims.email) {
                                    await router.navigate(`/verify?email=${encodeURIComponent(claims.email)}`);
                                }
                            }
                        }
                        return Promise.reject(error);
                    }

                    const { data } = await authApi.authRefreshPost();
                    const newToken = data.accessToken;
                    useSessionStore.getState().setToken(newToken);

                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    useSessionStore.getState().logout();
                    return Promise.reject(refreshError);
                }
            }
        }

        return Promise.reject(error);
    }
);

export const authApi = new AuthApi(undefined, undefined, api)
export const userApi = new UserApi(undefined, undefined, api)
export const messageApi = new MessageApi(undefined, undefined, api)
export const roomApi = new RoomApi(undefined, undefined, api)