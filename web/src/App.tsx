import { Outlet } from "react-router-dom";
import { Header } from "./components/Header.tsx";
import { useSessionStore } from "./stores/sessionStore.ts";
import { useEffect } from "react";
import { authApi, userApi } from "./api.ts";

function App() {
    const { setUser, logout, setInitialized, setToken } = useSessionStore();

    useEffect(() => {
        const requestAuth = async () => {
            try {
                const { data: authData } = await authApi.authRefreshPost();
                setToken(authData.accessToken)
                const { data } = await userApi.usersMeGet();
                setUser(data);
            } catch {
                logout();
            } finally {
                setInitialized();
            }
        }

        requestAuth();
    }, [logout, setInitialized, setUser, setToken]);

    return (
        <>
            <Header />
            <Outlet />
        </>
    )
}

export default App
