import {Button, Center, Paper, Stack, Text, Title,} from "@mantine/core";
import {useSessionStore} from "../stores/sessionStore.ts";
import {authApi} from "../api.ts";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import ChangePasswordForm from "../components/ChangePasswordForm.tsx";
import EmailSection from "../components/EmailSection.tsx";
import AvatarSection from "../components/AvatarSection.tsx";

export default function Profile() {
    const {user, logout} = useSessionStore();
    const navigate = useNavigate();


    const [changingPassword, setChangingPassword] = useState(false);

    if (!user) {
        return (
            <Center h="100vh">
                <Text>User not found</Text>
            </Center>
        );
    }

    const handleLogout = async () => {
        try {
            await authApi.authLogoutPost();
        } finally {
            logout();
            navigate("/login");
        }
    };


    const handlePasswordCancel = () => {
        setChangingPassword(false);
    };

    return (
        <Center h="calc(100vh - 80px)" p="md">
            <Paper shadow="sm" withBorder radius="lg" p="xl" w="100%" maw={500}>
                <Stack align="center">
                    <AvatarSection/>

                    <Title order={2}>{user.username}</Title>

                    <EmailSection/>

                    {!changingPassword && (
                        <Button
                            variant="outline"
                            mt="sm"
                            fullWidth
                            onClick={() => setChangingPassword(true)}
                        >
                            Change Password
                        </Button>
                    )}
                    {changingPassword && (
                        <ChangePasswordForm handlePasswordCancel={handlePasswordCancel}/>

                    )}
                    <Button color="red" variant="subtle" onClick={handleLogout}>
                        Logout
                    </Button>

                </Stack>
            </Paper>
        </Center>
    );
}
