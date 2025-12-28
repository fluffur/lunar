import {Button, Center, ColorSwatch, Group, Paper, Stack, Text, Title,} from "@mantine/core";
import {useSessionStore} from "../stores/sessionStore.ts";
import {authApi} from "../api.ts";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import ChangePasswordForm from "../components/ChangePasswordForm.tsx";
import EmailSection from "../components/EmailSection.tsx";
import AvatarSection from "../components/AvatarSection.tsx";
import {useUiStore} from "../stores/uiStore.ts";
import {IconCheck} from "@tabler/icons-react";

export default function Profile() {
    const {user, logout} = useSessionStore();
    const navigate = useNavigate();

    const {primaryColor, setPrimaryColor} = useUiStore();
    const colors = [
        'blue',
        'teal',
        'green',
        'violet',
        'grape',
        'indigo',
        'cyan',
        'orange',
        'red',
    ];


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

                    <Text>
                        Choose primary color:
                    </Text>

                    <Group>
                        {colors.map((color) => (
                            <ColorSwatch
                                color={`var(--mantine-color-${color}-6)`}
                                size={30}
                                radius="sm"
                                onClick={() => setPrimaryColor(color)}
                                style={{
                                    cursor: "pointer",
                                    border:
                                        primaryColor === color
                                            ? "2px solid var(--mantine-color-dark-6)"
                                            : "2px solid transparent",
                                    transition: "all 0.2s ease",
                                    position: "relative",
                                }}
                            >
                                {primaryColor === color && (
                                    <IconCheck
                                        size={16}
                                        style={{
                                            position: "absolute",
                                            top: 6,
                                            left: 6,
                                            color: "white",
                                        }}
                                    />
                                )}
                            </ColorSwatch>
                        ))}
                    </Group>


                    {!changingPassword && (
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => setChangingPassword(true)}
                        >
                            Change Password
                        </Button>
                    )}
                    {changingPassword && (
                        <ChangePasswordForm handlePasswordCancel={handlePasswordCancel}/>

                    )}
                    <Button color="red" variant="outline" onClick={handleLogout} fullWidth>
                        Logout
                    </Button>

                </Stack>

            </Paper>
        </Center>
    );
}
