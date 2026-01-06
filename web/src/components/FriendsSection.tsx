import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    Group,
    Stack,
    Text,
    TextInput,
    Title,
    Tabs,
    ActionIcon,
    Badge,
    Paper,
    Divider,
    Loader,
    Alert
} from '@mantine/core';
import { IconUserPlus, IconCheck, IconX, IconUserMinus, IconAlertCircle } from '@tabler/icons-react';
import { UserAvatar } from './UserAvatar';
import { api } from '../api';

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

interface FriendsResponse {
    friends: Friend[];
}

interface FriendRequestsResponse {
    requests: FriendRequest[];
}

export function FriendsSection() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingFriends, setLoadingFriends] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const loadFriends = async () => {
        try {
            setLoadingFriends(true);
            const { data } = await api.get<FriendsResponse>('/friends');
            setFriends(data.friends);
        } catch (err: any) {
            console.error('Failed to load friends', err);
            setError(err.response?.data?.error?.message || 'Failed to load friends');
        } finally {
            setLoadingFriends(false);
        }
    };

    const loadIncomingRequests = async () => {
        try {
            const { data } = await api.get<FriendRequestsResponse>('/friends/requests/incoming');
            setIncomingRequests(data.requests);
        } catch (err: any) {
            console.error('Failed to load incoming requests', err);
        }
    };

    const loadOutgoingRequests = async () => {
        try {
            const { data } = await api.get<FriendRequestsResponse>('/friends/requests/outgoing');
            setOutgoingRequests(data.requests);
        } catch (err: any) {
            console.error('Failed to load outgoing requests', err);
        }
    };

    useEffect(() => {
        loadFriends();
        loadIncomingRequests();
        loadOutgoingRequests();
    }, []);

    const handleSendRequest = async () => {
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post('/friends/requests', {
                username: username.trim(),
                message: message.trim() || undefined
            });
            setSuccess(`Friend request sent to ${username}`);
            setUsername('');
            setMessage('');
            loadOutgoingRequests();
        } catch (err: any) {
            const errorMsg = err.response?.data?.error?.message || err.response?.data?.error?.fields?.username || 'Failed to send friend request';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (fromId: string) => {
        try {
            await api.post(`/friends/requests/${fromId}/accept`);
            setSuccess('Friend request accepted');
            loadFriends();
            loadIncomingRequests();
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to accept request');
        }
    };

    const handleRejectRequest = async (fromId: string) => {
        try {
            await api.post(`/friends/requests/${fromId}/reject`);
            setSuccess('Friend request rejected');
            loadIncomingRequests();
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to reject request');
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!confirm('Are you sure you want to remove this friend?')) {
            return;
        }

        try {
            await api.delete(`/friends/${friendId}`);
            setSuccess('Friend removed');
            loadFriends();
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to remove friend');
        }
    };

    const handleCancelRequest = async (toId: string) => {
        try {
            await api.post(`/friends/requests/${toId}/cancel`);
            setSuccess('Friend request cancelled');
            loadOutgoingRequests();
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to cancel request');
        }
    };

    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Stack gap="md">
                <Title order={3}>Friends</Title>

                {error && (
                    <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" onClose={() => setError(null)} withCloseButton>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert icon={<IconCheck size={16} />} title="Success" color="green" onClose={() => setSuccess(null)} withCloseButton>
                        {success}
                    </Alert>
                )}

                <Paper p="md" withBorder radius="md">
                    <Stack gap="sm">
                        <Text size="sm" fw={500}>Add Friend by Username</Text>
                        <TextInput
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendRequest();
                                }
                            }}
                        />
                        <TextInput
                            placeholder="Optional message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendRequest();
                                }
                            }}
                        />
                        <Button
                            leftSection={<IconUserPlus size={16} />}
                            onClick={handleSendRequest}
                            loading={loading}
                            disabled={!username.trim()}
                            fullWidth
                        >
                            Send Friend Request
                        </Button>
                    </Stack>
                </Paper>

                <Tabs defaultValue="friends">
                    <Tabs.List>
                        <Tabs.Tab value="friends">
                            Friends
                            {friends.length > 0 && (
                                <Badge size="sm" variant="light" ml="xs">
                                    {friends.length}
                                </Badge>
                            )}
                        </Tabs.Tab>
                        <Tabs.Tab value="incoming">
                            Incoming
                            {incomingRequests.length > 0 && (
                                <Badge size="sm" variant="light" color="blue" ml="xs">
                                    {incomingRequests.length}
                                </Badge>
                            )}
                        </Tabs.Tab>
                        <Tabs.Tab value="outgoing">
                            Outgoing
                            {outgoingRequests.length > 0 && (
                                <Badge size="sm" variant="light" color="gray" ml="xs">
                                    {outgoingRequests.length}
                                </Badge>
                            )}
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="friends" pt="md">
                        {loadingFriends ? (
                            <Group justify="center" p="xl">
                                <Loader />
                            </Group>
                        ) : friends.length === 0 ? (
                            <Text c="dimmed" ta="center" p="xl">
                                No friends yet. Send a friend request to get started!
                            </Text>
                        ) : (
                            <Stack gap="sm">
                                {friends.length > 3 && (
                                    <TextInput
                                        placeholder="Search friends..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        mb="xs"
                                    />
                                )}
                                {filteredFriends.length === 0 ? (
                                    <Text c="dimmed" ta="center" p="md">
                                        No friends found matching "{searchQuery}"
                                    </Text>
                                ) : (
                                    filteredFriends.map((friend) => (
                                        <Paper key={friend.id} p="sm" withBorder radius="md">
                                            <Group justify="space-between">
                                                <Group>
                                                    <UserAvatar
                                                        username={friend.username}
                                                        avatarUrl={friend.avatarUrl}
                                                        size={40}
                                                    />
                                                    <div>
                                                        <Text fw={500}>{friend.username}</Text>
                                                    </div>
                                                </Group>
                                                <ActionIcon
                                                    color="red"
                                                    variant="light"
                                                    onClick={() => handleRemoveFriend(friend.id)}
                                                    title="Remove friend"
                                                >
                                                    <IconUserMinus size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Paper>
                                    ))
                                )}
                            </Stack>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="incoming" pt="md">
                        {incomingRequests.length === 0 ? (
                            <Text c="dimmed" ta="center" p="xl">
                                No incoming friend requests
                            </Text>
                        ) : (
                            <Stack gap="sm">
                                {incomingRequests.map((request) => (
                                    <Paper key={request.fromUserId} p="sm" withBorder radius="md">
                                        <Stack gap="sm">
                                            <Group justify="space-between">
                                                <Group>
                                                    {request.fromUser && (
                                                        <>
                                                            <UserAvatar
                                                                username={request.fromUser.username}
                                                                avatarUrl={request.fromUser.avatarUrl}
                                                                size={40}
                                                            />
                                                            <div>
                                                                <Text fw={500}>{request.fromUser.username}</Text>
                                                                {request.message && (
                                                                    <Text size="sm" c="dimmed">
                                                                        {request.message}
                                                                    </Text>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </Group>
                                                <Group gap="xs">
                                                    <Button
                                                        size="xs"
                                                        color="green"
                                                        leftSection={<IconCheck size={14} />}
                                                        onClick={() => handleAcceptRequest(request.fromUserId)}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        color="red"
                                                        variant="light"
                                                        leftSection={<IconX size={14} />}
                                                        onClick={() => handleRejectRequest(request.fromUserId)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </Group>
                                            </Group>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="outgoing" pt="md">
                        {outgoingRequests.length === 0 ? (
                            <Text c="dimmed" ta="center" p="xl">
                                No outgoing friend requests
                            </Text>
                        ) : (
                            <Stack gap="sm">
                                {outgoingRequests.map((request) => (
                                    <Paper key={request.toUserId} p="sm" withBorder radius="md">
                                        <Group justify="space-between">
                                            <Group>
                                                {request.toUser && (
                                                    <>
                                                        <UserAvatar
                                                            username={request.toUser.username}
                                                            avatarUrl={request.toUser.avatarUrl}
                                                            size={40}
                                                        />
                                                        <div>
                                                            <Text fw={500}>{request.toUser.username}</Text>
                                                            <Text size="xs" c="dimmed">
                                                                Status: {request.status}
                                                            </Text>
                                                            {request.message && (
                                                                <Text size="sm" c="dimmed">
                                                                    {request.message}
                                                                </Text>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </Group>
                                            <Button
                                                size="xs"
                                                color="red"
                                                variant="light"
                                                leftSection={<IconX size={14} />}
                                                onClick={() => handleCancelRequest(request.toUserId)}
                                            >
                                                Cancel
                                            </Button>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Card>
    );
}

