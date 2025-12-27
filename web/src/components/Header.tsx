import {Link} from 'react-router-dom';
import {Button, Container, Group, Menu, Text, UnstyledButton} from '@mantine/core';
import {useSessionStore} from "../stores/sessionStore.ts";
import {authApi} from "../api.ts";
import {UserAvatar} from "./UserAvatar.tsx";
import {IconLogout, IconUserFilled} from "@tabler/icons-react";

export function Header() {
    const {user, logout} = useSessionStore();

    const handleLogout = async () => {
        await authApi.authLogoutPost()
        logout();
    }


    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(20, 20, 20, 0.7)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px 0'
        }}>
            <Container size="md">
                <Group justify="space-between" h="100%">
                    <Text
                        size="xl"
                        fw={900}
                        style={{cursor: 'pointer', letterSpacing: '-1px'}}
                        component={Link} to="/"
                    >
                        LUNAR
                    </Text>

                    <Group>
                        {user ? (
                            <>
                                <Button variant="subtle" component={Link} to="/chats">Chats</Button>
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
                                                            size={32}/>
                                                <Text fw={600} size="sm" lh={1} mr={3}>
                                                    {user.username}
                                                </Text>
                                            </Group>
                                        </UnstyledButton>
                                    </Menu.Target>

                                    <Menu.Dropdown>

                                        <Menu.Item component={Link} to="/profile"
                                                   leftSection={<IconUserFilled size={16}/>}>
                                            Profile
                                        </Menu.Item>


                                        <Menu.Divider/>

                                        <Menu.Item color="red" onClick={handleLogout}
                                                   leftSection={<IconLogout size={16}/>}>
                                            Logout
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </>
                        ) : (
                            <Group>
                                <Button variant="subtle" color="gray" component={Link} to="/login">Log in</Button>
                                <Button component={Link}
                                        to="/register">Sign up</Button>
                            </Group>
                        )}
                    </Group>
                </Group>
            </Container>
        </header>
    );
}
