import { useCallback } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { authApi } from '../api';
import { isTokenExpired } from '../utils/isTokenExpired';

export function useAuthRefresh() {
    const { token, setToken, logout } = useSessionStore();

    const refreshToken = useCallback(async () => {
        try {
            const { data } = await authApi.authRefreshPost();
            const newToken = data.accessToken;
            if (newToken) {
                setToken(newToken);
                return newToken;
            }
            throw new Error("No access token received");
        } catch (error) {
            console.error("Failed to refresh token:", error);
            logout();
            return null;
        }
    }, [setToken, logout]);

    const ensureValidToken = useCallback(async () => {
        const currentToken = useSessionStore.getState().token;
        if (!currentToken || isTokenExpired(currentToken)) {
            return await refreshToken();
        }
        return currentToken;
    }, [refreshToken]);

    return { token, refreshToken, ensureValidToken };
}
