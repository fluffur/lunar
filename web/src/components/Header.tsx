import { Link } from 'react-router-dom';
import { ActionIcon, Button, Container, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { useSessionStore } from "../stores/sessionStore.ts";
import { authApi } from "../api.ts";
import { UserAvatar } from "./UserAvatar.tsx";
import { IconLogout, IconMoonStars, IconSun, IconUserFilled } from "@tabler/icons-react";
import { useUiStore } from "../stores/uiStore.ts";

export function Header() {
    const { user, logout } = useSessionStore();

    const handleLogout = async () => {
        await authApi.authLogoutPost()
        logout();
    }

    const { colorScheme, setColorScheme } = useUiStore()

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderBottom: '1px solid var(--mantine-color-default-border)',
            height: 60,
        }}>
            <Container size="md" h="100%" maw={1200}>
                <Group justify="space-between" h="100%">
                    <Text
                        size="xl"
                        fw={900}
                        style={{ cursor: 'pointer', letterSpacing: '-1px' }}
                        component={Link} to="/"
                    >
                        LUNAR
                    </Text>

                    <Group>
                        {user ? (
                            <>
                                <Button variant="subtle" component={Link} to="/rooms">Rooms</Button>
                                <Menu shadow="xl" width={200} withArrow position="bottom-end">
                                    <Menu.Target>
                                        <UnstyledButton>
                                            <Group gap={10} style={{
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                transition: 'background 0.2s ease'
                                            }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <UserAvatar username={user.username} avatarUrl={user.avatarUrl}
                                                    size={32} />
                                                <Text fw={600} size="sm" lh={1} mr={3}>
                                                    {user.username}
                                                </Text>
                                            </Group>
                                        </UnstyledButton>
                                    </Menu.Target>

                                    <Menu.Dropdown>

                                        <Menu.Item component={Link} to="/profile"
                                            leftSection={<IconUserFilled size={16} />}>
                                            Profile
                                        </Menu.Item>


                                        <Menu.Divider />

                                        <Menu.Item color="red" onClick={handleLogout}
                                            leftSection={<IconLogout size={16} />}>
                                            Logout
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </>
                        ) : (
                            <Group>
                                <Button variant="subtle" component={Link} to="/login">Log in</Button>
                                <Button component={Link}
                                    to="/register">Sign up</Button>
                            </Group>
                        )}


                        <ActionIcon
                            variant="subtle"
                            radius="xl"
                            size="lg"
                            onClick={() =>
                                setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
                            }
                        >
                            {colorScheme === 'dark'
                                ? <IconSun size={18} />
                                : <IconMoonStars size={18} />}
                        </ActionIcon>
                    </Group>
                </Group>
            </Container>
        </header>
    );
}
