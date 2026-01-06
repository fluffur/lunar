import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from "react-router-dom";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import Profile from "./pages/Profile.tsx";
import Rooms from "./pages/Rooms.tsx";
import Room from "./pages/Room.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ProtectedRoute } from "./layouts/ProtectedRoute.tsx";
import { RoomsLayout } from "./layouts/RoomsLayout.tsx";
import App from "./App.tsx";

export const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<App />}>
            <Route index element={<Home />} />
            <Route element={<ProtectedRoute />}>
                <Route path="profile" element={<Profile />} />
                <Route element={<RoomsLayout />}>
                    <Route path="rooms" element={<Rooms />} />
                    <Route path="r/:roomSlug" element={<Room />} />
                </Route>
            </Route>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="verify" element={<VerifyEmail />} />
            <Route path="404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
    )
);
