import {Route, Routes} from "react-router-dom";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import {ProtectedRoute} from "./routes/ProtectedRoute.tsx";
import Chats from "./pages/Chats.tsx";
import {Header} from "./components/Header.tsx";
import {useSessionStore} from "./stores/sessionStore.ts";
import {useEffect} from "react";
import {api} from "./api.ts";
import Chat from "./pages/Chat.tsx";
import Profile from "./pages/Profile.tsx";

function App() {
    const {setUser, logout, setInitialized} = useSessionStore();

    useEffect(() => {
        const requestAuth = async () => {
            try {
                const {data} = await api.get("/users/me");
                setUser(data);
            } catch {
                logout();
            } finally {
                setInitialized();
            }
        }

        requestAuth();
    }, [logout, setInitialized, setUser]);

    return (
        <>
            <Header/>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route element={<ProtectedRoute/>}>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/chats">
                        <Route index element={<Chats/>}/>
                        <Route path=":chatId" element={<Chat/>}/>
                    </Route>

                </Route>
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="/404" element={<NotFound/>}/>
                <Route path="*" element={<NotFound/>}/>

            </Routes>
        </>

    )
}

export default App
