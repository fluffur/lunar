import {Navigate, Outlet} from 'react-router-dom';
import {useSessionStore} from "../stores/sessionStore.ts";
import {Center, Loader} from "@mantine/core";

export function ProtectedRoute() {
    const {initialized, token} = useSessionStore();
    if (!initialized) return (
        <Center h="90vh">
            <Loader/>
        </Center>
    );

    if (!token) return <Navigate to="/login" replace/>;

    return <Outlet/>;
}
