import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import { ProtectedRoute } from "./layouts/ProtectedRoute.tsx";
import { RoomsLayout } from "./layouts/RoomsLayout.tsx";
import Rooms from "./pages/Rooms.tsx";
import { Header } from "./components/Header.tsx";
import { useSessionStore } from "./stores/sessionStore.ts";
import { useEffect } from "react";
import { authApi, userApi } from "./api.ts";
import Room from "./pages/Room.tsx";
import Profile from "./pages/Profile.tsx";

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
            <Routes>
                <Route path="/" element={<Home />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/profile" element={<Profile />} />
                    <Route element={<RoomsLayout />}>
                        <Route path="/rooms" element={<Rooms />} />
                        <Route path="/r/:roomSlug" element={<Room />} />
                    </Route>

                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<NotFound />} />

            </Routes>
        </>

    )
}

export default App
