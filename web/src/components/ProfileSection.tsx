import {Button, Group, Stack, Text, Title, ColorSwatch} from "@mantine/core";
import {useState} from "react";
import {useSessionStore} from "../stores/sessionStore.ts";
import {authApi} from "../api.ts";
import {useNavigate} from "react-router-dom";
import ChangePasswordForm from "./ChangePasswordForm.tsx";
import EmailSection from "./EmailSection.tsx";
import AvatarSection from "./AvatarSection.tsx";
import {useUiStore} from "../stores/uiStore.ts";
import {IconCheck} from "@tabler/icons-react";

export function ProfileSection() {
    const {user, logout} = useSessionStore();
    const navigate = useNavigate();
    const {primaryColor, setPrimaryColor} = useUiStore();

    const colors = [
        "blue",
        "teal",
        "green",
        "violet",
        "grape",
        "indigo",
        "cyan",
        "orange",
        "red",
    ];

    const [changingPassword, setChangingPassword] = useState(false);

    if (!user) {
        return (
            <Stack align="center" w="100%">
                <Text>User not found</Text>
            </Stack>
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
        <Stack align="center" w="100%">
            <AvatarSection/>

            <Title order={2}>{user.username}</Title>

            <EmailSection/>

            <Text>Choose primary color:</Text>

            <Group>
                {colors.map((color) => (
                    <ColorSwatch
                        key={color}
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
    );
}

