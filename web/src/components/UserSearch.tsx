import {useEffect, useState} from 'react';
import {
    ActionIcon,
    Group,
    Paper,
    rem,
    ScrollArea,
    Stack,
    Text,
    TextInput
} from '@mantine/core';
import {IconSearch, IconUserPlus, IconCheck} from "@tabler/icons-react";
import {api} from "../api.ts";
import {UserAvatar} from "./UserAvatar.tsx";

export interface SearchUser {
    id: string;
    username: string;
    avatarUrl?: string | null;
}

interface UserSearchProps {
    onAddFriend?: (username: string) => Promise<void> | void;
}

type RequestStatus = 'success' | 'error' | null;

export function UserSearch({onAddFriend}: UserSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [requestStatuses, setRequestStatuses] = useState<Record<string, RequestStatus>>({});

    useEffect(() => {
        const searchUsers = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                const {data} = await api.get<SearchUser[]>('/users/search', {
                    params: { q: searchQuery }
                });
                setSearchResults(data || []);
            } catch (err) {
                console.error('Failed to search users', err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleAddFriend = async (userId: string, username: string) => {
        if (onAddFriend) {
            try {
                await onAddFriend(username);
                setRequestStatuses(prev => ({ ...prev, [userId]: 'success' }));
                setTimeout(() => {
                    setRequestStatuses(prev => {
                        const newStatuses = { ...prev };
                        delete newStatuses[userId];
                        return newStatuses;
                    });
                }, 3000);
            } catch (err) {
                console.error('Failed to send friend request', err);
                setRequestStatuses(prev => ({ ...prev, [userId]: 'error' }));
                setTimeout(() => {
                    setRequestStatuses(prev => {
                        const newStatuses = { ...prev };
                        delete newStatuses[userId];
                        return newStatuses;
                    });
                }, 3000);
            }
        } else {
            try {
                await api.post('/friends/requests', { 
                    username: username,
                    message: '' 
                });
                setRequestStatuses(prev => ({ ...prev, [userId]: 'success' }));
                setTimeout(() => {
                    setRequestStatuses(prev => {
                        const newStatuses = { ...prev };
                        delete newStatuses[userId];
                        return newStatuses;
                    });
                }, 3000);
            } catch (err) {
                console.error('Failed to send friend request', err);
                setRequestStatuses(prev => ({ ...prev, [userId]: 'error' }));
                setTimeout(() => {
                    setRequestStatuses(prev => {
                        const newStatuses = { ...prev };
                        delete newStatuses[userId];
                        return newStatuses;
                    });
                }, 3000);
            }
        }
    };

    return (
        <>
            <TextInput
                placeholder="Search users by username..."
                leftSection={<IconSearch style={{width: rem(16), height: rem(16)}} stroke={1.5}/>}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
            />

            <Paper shadow="sm" radius="lg"
                   style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                <ScrollArea style={{flex: 1}}>
                    <Stack gap="sm" py="md" px={0}>
                        {isSearching && (
                            <Text c="dimmed" size="sm" ta="center" py="xl">
                                Searching...
                            </Text>
                        )}
                        {!isSearching && searchResults.map((user) => (
                            <Stack key={user.id} gap="xs">
                                <Paper 
                                    p="md"
                                    shadow="sm"
                                    radius="md"
                                >
                                    <Group justify="space-between">
                                        <Group>
                                            <UserAvatar
                                                username={user.username}
                                                avatarUrl={user.avatarUrl}
                                                size={48}
                                            />
                                            <div>
                                                <Text fw={500} size="md">{user.username}</Text>
                                            </div>
                                        </Group>
                                        <ActionIcon
                                            size="lg"
                                            variant="light"
                                            color="green"
                                            onClick={() => handleAddFriend(user.id, user.username)}
                                            disabled={requestStatuses[user.id] === 'success'}
                                        >
                                            {requestStatuses[user.id] === 'success' ? (
                                                <IconCheck size={18} />
                                            ) : (
                                                <IconUserPlus size={18} />
                                            )}
                                        </ActionIcon>
                                    </Group>
                                </Paper>
                                {requestStatuses[user.id] === 'success' && (
                                    <Text c="green" size="sm" px="md">
                                        Friend request sent successfully
                                    </Text>
                                )}
                                {requestStatuses[user.id] === 'error' && (
                                    <Text c="red" size="sm" px="md">
                                        Failed to send friend request
                                    </Text>
                                )}
                            </Stack>
                        ))}
                        {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
                            <Text c="dimmed" size="sm" ta="center" py="xl">
                                No users found
                            </Text>
                        )}
                        {!isSearching && !searchQuery.trim() && (
                            <Text c="dimmed" size="sm" ta="center" py="xl">
                                Start typing to search for users
                            </Text>
                        )}
                    </Stack>
                </ScrollArea>
            </Paper>
        </>
    );
}


