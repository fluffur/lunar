import {useEffect, useState} from 'react';
import {
    ActionIcon,
    Box,
    Group,
    Menu,
    Paper,
    rem,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Title,
    Badge
} from '@mantine/core';
import {useNavigate} from 'react-router-dom';
import {api} from "../api.ts";
import {IconChevronLeft, IconLogout, IconPhone, IconSearch, IconUserMinus, IconDots} from "@tabler/icons-react";
import {useSessionStore} from "../stores/sessionStore.ts";
import {UserAvatar} from "./UserAvatar.tsx";
import {useMediaQuery} from "@mantine/hooks";

interface Friend {
    id: string;
    username: string;
    avatarUrl?: string | null;
}

interface FriendRequest {
    fromUserId: string;
    toUserId: string;
    status: string;
    message?: string;
    createdAt: string;
    respondedAt?: string;
    fromUser?: Friend;
    toUser?: Friend;
}

interface FriendsSidebarProps {
    onClose?: () => void;
}

export function FriendsSidebar({onClose}: FriendsSidebarProps) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const {user, logout} = useSessionStore();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);
    const [hoveredFriendId, setHoveredFriendId] = useState<string | null>(null);

    const loadFriends = async () => {
        try {
            const {data} = await api.get<Friend[]>('/friends');
            setFriends(data);
        } catch (err) {
            console.error('Failed to load friends', err);
        }
    };

    const loadIncomingRequests = async () => {
        try {
            const {data} = await api.get<FriendRequest[]>('/friends/requests/incoming');
            setIncomingRequests(data);
        } catch (err) {
            console.error('Failed to load incoming requests', err);
        }
    };

    useEffect(() => {
        loadFriends();
        loadIncomingRequests();
    }, []);

    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCall = async (friendId: string) => {
        try {
            const {data} = await api.post<{ room_name: string }>('/call/start', {callee_id: friendId});
            navigate(`/call/${data.room_name}`);
            if (isMobile && onClose) {
                onClose();
            }
        } catch (err) {
            console.error('Failed to start call', err);
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!confirm('Are you sure you want to remove this friend?')) {
            return;
        }
        try {
            await api.delete(`/friends/${friendId}`);
            loadFriends();
        } catch (err) {
            console.error('Failed to remove friend', err);
        }
    };

    return (
        <Box h="100%" p="md" display="flex" style={{flexDirection: 'column', gap: 'var(--mantine-spacing-md)'}}>
            <Group justify="space-between">
                <Group gap="xs">
                    <Title order={3}>Friends</Title>
                    {incomingRequests.length > 0 && (
                        <Badge size="sm" variant="filled" color="blue">
                            {incomingRequests.length}
                        </Badge>
                    )}
                </Group>
                <Group gap="xs">
                    {onClose && (
                        <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                            <IconChevronLeft size={20}/>
                        </ActionIcon>
                    )}
                </Group>
            </Group>

            <TextInput
                placeholder="Search friends..."
                leftSection={<IconSearch style={{width: rem(16), height: rem(16)}} stroke={1.5}/>}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
            />

            <Paper shadow="sm" radius="lg"
                   style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                <ScrollArea style={{flex: 1}}>
                    <Stack gap="sm" py="md" px={0}>
                        {filteredFriends.map((friend) => (
                            <Menu 
                                key={friend.id} 
                                position="bottom-end" 
                                withArrow 
                                opened={openedMenuId === friend.id}
                                onChange={(opened) => setOpenedMenuId(opened ? friend.id : null)}
                            >
                                <Menu.Target>
                                    <Paper 
                                        p="md"
                                        shadow="sm"
                                        radius="md"
                                        style={{ 
                                            cursor: 'pointer',
                                            backgroundColor: hoveredFriendId === friend.id 
                                                ? 'var(--mantine-color-dark-6)' 
                                                : undefined
                                        }}
                                        onMouseEnter={() => setHoveredFriendId(friend.id)}
                                        onMouseLeave={() => setHoveredFriendId(null)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setOpenedMenuId(friend.id);
                                        }}
                                    >
                                        <Group justify="space-between">
                                            <Group>
                                                <UserAvatar
                                                    username={friend.username}
                                                    avatarUrl={friend.avatarUrl}
                                                    size={48}
                                                />
                                                <div>
                                                    <Text fw={500} size="md">{friend.username}</Text>
                                                </div>
                                            </Group>
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                size="md"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenedMenuId(friend.id);
                                                }}
                                            >
                                                <IconDots size={18}/>
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item
                                        leftSection={<IconPhone size={16} />}
                                        onClick={() => {
                                            handleCall(friend.id);
                                            setOpenedMenuId(null);
                                        }}
                                    >
                                        Позвонить
                                    </Menu.Item>
                                    <Menu.Item
                                        leftSection={<IconUserMinus size={16} />}
                                        color="red"
                                        onClick={() => {
                                            handleRemoveFriend(friend.id);
                                            setOpenedMenuId(null);
                                        }}
                                    >
                                        Удалить из друзей
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        ))}
                        {filteredFriends.length === 0 && (
                            <Text c="dimmed" size="sm" ta="center" py="xl">
                                {friends.length === 0 ? "No friends yet" : "No results"}
                            </Text>
                        )}
                    </Stack>
                </ScrollArea>
            </Paper>

            <Paper 
                shadow="sm" 
                radius="lg" 
                p="md"
                style={{ backgroundColor: 'var(--mantine-color-dark-6)' }}
            >
                <Group>
                    {user && <UserAvatar username={user.username} avatarUrl={user.avatarUrl}/>}
                    <div style={{flex: 1, overflow: 'hidden'}}>
                        <Text size="sm" fw={500} truncate>{user?.username}</Text>
                        <Text c="dimmed" size="xs" truncate>{user?.email}</Text>
                    </div>
                    <ActionIcon variant="subtle" color="red" onClick={logout} title="Logout">
                        <IconLogout style={{width: rem(18), height: rem(18)}} stroke={1.5}/>
                    </ActionIcon>
                </Group>
            </Paper>
        </Box>
    );
}
