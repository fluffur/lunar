import {useEffect, useState} from 'react';
import {
    ActionIcon,
    Box,
    Group,
    Paper,
    rem,
    ScrollArea,
    Text,
    TextInput,
    Title,
    Badge,
    SegmentedControl
} from '@mantine/core';
import {useNavigate} from 'react-router-dom';
import {api} from "../api.ts";
import {IconChevronLeft, IconLogout, IconSearch, IconUserPlus, IconUsers, IconUserCheck, IconUserX} from "@tabler/icons-react";
import {useSessionStore} from "../stores/sessionStore.ts";
import {useUiStore} from "../stores/uiStore.ts";
import {UserAvatar} from "./UserAvatar.tsx";
import {useMediaQuery} from "@mantine/hooks";
import {UserSearch} from "./UserSearch.tsx";
import {FriendsList} from "./FriendsList.tsx";
import {IncomingRequestsList} from "./IncomingRequestsList.tsx";
import {OutgoingRequestsList} from "./OutgoingRequestsList.tsx";

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

type FriendsTab = 'all' | 'incoming' | 'outgoing';

export function FriendsSidebar({onClose}: FriendsSidebarProps) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const {user, logout} = useSessionStore();
    const {primaryColor} = useUiStore();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [openedMenuId, setOpenedMenuId] = useState<string | null>(null);
    const [hoveredFriendId, setHoveredFriendId] = useState<string | null>(null);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [activeTab, setActiveTab] = useState<FriendsTab>('all');

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

    const loadOutgoingRequests = async () => {
        try {
            const {data} = await api.get<FriendRequest[]>('/friends/requests/outgoing');
            setOutgoingRequests(data);
        } catch (err) {
            console.error('Failed to load outgoing requests', err);
        }
    };

    useEffect(() => {
        if (!showAddFriend) {
            loadFriends();
            loadIncomingRequests();
            loadOutgoingRequests();
        }
    }, [showAddFriend]);

    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredIncoming = incomingRequests.filter(req =>
        req.fromUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredOutgoing = outgoingRequests.filter(req =>
        req.toUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
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

    const handleAcceptRequest = async (fromId: string) => {
        try {
            await api.post(`/friends/requests/${fromId}/accept`);
            loadIncomingRequests();
            loadFriends();
        } catch (err) {
            console.error('Failed to accept friend request', err);
        }
    };

    const handleRejectRequest = async (fromId: string) => {
        try {
            await api.post(`/friends/requests/${fromId}/reject`);
            loadIncomingRequests();
        } catch (err) {
            console.error('Failed to reject friend request', err);
        }
    };

    const handleCancelRequest = async (toId: string) => {
        try {
            await api.post(`/friends/requests/${toId}/cancel`);
            loadOutgoingRequests();
        } catch (err) {
            console.error('Failed to cancel friend request', err);
        }
    };

    const handleSendFriendRequest = async (username: string) => {
        try {
            await api.post('/friends/requests', { 
                username: username,
                message: '' 
            });
            loadOutgoingRequests();
        } catch (err) {
            console.error('Failed to send friend request', err);
        }
    };

    const handleAddFriendClick = () => {
        setShowAddFriend(true);
    };

    const handleBackToFriends = () => {
        setShowAddFriend(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'all':
                return (
                    <FriendsList
                        friends={filteredFriends}
                        onCall={handleCall}
                        onRemoveFriend={handleRemoveFriend}
                        openedMenuId={openedMenuId}
                        onMenuChange={setOpenedMenuId}
                        hoveredFriendId={hoveredFriendId}
                        onHover={setHoveredFriendId}
                    />
                );
            case 'incoming':
                return (
                    <IncomingRequestsList
                        requests={filteredIncoming}
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                    />
                );
            case 'outgoing':
                return (
                    <OutgoingRequestsList
                        requests={filteredOutgoing}
                        onCancel={handleCancelRequest}
                    />
                );
        }
    };

    return (
        <Box h="100%" p="md" display="flex" style={{flexDirection: 'column', gap: 'var(--mantine-spacing-md)'}}>
            <Group justify="space-between">
                <Group gap="xs">
                    <Title order={3}>{showAddFriend ? 'Add Friends' : 'Friends'}</Title>
                </Group>
                <Group gap="xs">
                    {!showAddFriend && (
                        <ActionIcon 
                            variant="subtle" 
                            color={primaryColor} 
                            onClick={handleAddFriendClick}
                            title="Add friend"
                        >
                            <IconUserPlus size={20}/>
                        </ActionIcon>
                    )}
                    {showAddFriend && (
                        <ActionIcon 
                            variant="subtle" 
                            color="gray" 
                            onClick={handleBackToFriends}
                            title="Back to friends"
                        >
                            <IconChevronLeft size={20}/>
                        </ActionIcon>
                    )}
                    {onClose && !showAddFriend && (
                        <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                            <IconChevronLeft size={20}/>
                        </ActionIcon>
                    )}
                </Group>
            </Group>

            {showAddFriend ? (
                <UserSearch onAddFriend={handleSendFriendRequest} />
            ) : (
                <>
                    <TextInput
                        placeholder="Search..."
                        leftSection={<IconSearch style={{width: rem(16), height: rem(16)}} stroke={1.5}/>}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.currentTarget.value)}
                    />

                    <SegmentedControl
                        value={activeTab}
                        onChange={(value) => setActiveTab(value as FriendsTab)}
                        data={[
                            {
                                value: 'all',
                                label: (
                                    <Group gap={4}>
                                        <IconUsers size={16} />
                                        <Text size="sm">All</Text>
                                    </Group>
                                )
                            },
                            {
                                value: 'incoming',
                                label: incomingRequests.length > 0 ? (
                                    <Group gap={4}>
                                        <Badge size="sm" variant="filled" color={primaryColor}>
                                            {incomingRequests.length}
                                        </Badge>
                                        <Text size="sm">Incoming</Text>
                                    </Group>
                                ) : (
                                    <Group gap={4}>
                                        <IconUserCheck size={16} />
                                        <Text size="sm">Incoming</Text>
                                    </Group>
                                )
                            },
                            {
                                value: 'outgoing',
                                label: (
                                    <Group gap={4}>
                                        <IconUserX size={16} />
                                        <Text size="sm">Outgoing</Text>
                                    </Group>
                                )
                            }
                        ]}
                        fullWidth
                    />

                    <Paper shadow="sm" radius="lg"
                           style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                        <ScrollArea style={{flex: 1}}>
                            {renderContent()}
                        </ScrollArea>
                    </Paper>
                </>
            )}

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
