import {useEffect, useState} from 'react';
import {
    ActionIcon,
    Avatar,
    Box,
    Group,
    NavLink,
    Paper,
    rem,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Title
} from '@mantine/core';
import {useNavigate, useParams} from 'react-router-dom';
import {chatApi} from "../api.ts";
import type {ModelChat} from "../../api";
import {IconLayoutSidebarLeftCollapse, IconLogout, IconPlus, IconSearch} from "@tabler/icons-react";
import {CreateChatModal} from "./CreateChatModal.tsx";
import {useSessionStore} from "../stores/sessionStore.ts";
import {UserAvatar} from "./UserAvatar.tsx";
import {useUiStore} from "../stores/uiStore.ts";

interface ChatsSidebarProps {
    onClose?: () => void;
}

export function ChatsSidebar({onClose}: ChatsSidebarProps) {
    const [chats, setChats] = useState<ModelChat[]>([]);
    const {chatId} = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const {user, logout} = useSessionStore();
    const {primaryColor} = useUiStore()
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const {data} = await chatApi.chatsGet();
                setChats(data.chats || []);
            } catch (error) {
                console.error("Failed to fetch chats", error);
            }
        };

        fetchChats();
    }, []);

    const filteredChats = chats.filter(chat =>
        (chat.name || chat.id).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Box h="100%" p="md" display="flex" style={{flexDirection: 'column', gap: 'var(--mantine-spacing-md)'}}>
            <Group justify="space-between">
                <Title order={3}>Chats</Title>
                <Group gap="xs">
                    <ActionIcon variant="light" size="lg" onClick={() => setCreateModalOpen(true)}>
                        <IconPlus size={20}/>
                    </ActionIcon>
                    {onClose && (
                        <ActionIcon variant="subtle" color="gray" onClick={onClose}>
                            <IconLayoutSidebarLeftCollapse size={20}/>
                        </ActionIcon>
                    )}
                </Group>
            </Group>

            <TextInput
                placeholder="Search chats..."
                leftSection={<IconSearch style={{width: rem(16), height: rem(16)}} stroke={1.5}/>}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.currentTarget.value)}
            />

            <Paper shadow="sm" radius="lg" withBorder
                   style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
                <ScrollArea style={{flex: 1}}>
                    <Stack gap={0}>
                        {filteredChats.map((chat) => (
                            <NavLink
                                key={chat.id}
                                label={chat.name || chat.id}
                                active={chat.id === chatId}
                                onClick={() => navigate(`/chats/${chat.id}`)}
                                leftSection={
                                    <Avatar radius="xl" size="sm" color={primaryColor}>
                                        {(chat.name || chat.id).slice(0, 2).toUpperCase()}
                                    </Avatar>
                                }
                                variant="light"
                                color="blue"
                                style={{
                                    borderRadius: 0,
                                    borderBottom: '1px solid var(--mantine-color-default-border)'
                                }}
                            />
                        ))}
                        {filteredChats.length === 0 && (
                            <Text c="dimmed" size="sm" ta="center" py="xl">
                                {chats.length === 0 ? "No chats found" : "No results"}
                            </Text>
                        )}
                    </Stack>
                </ScrollArea>
            </Paper>

            <Paper shadow="sm" radius="lg" withBorder p="xs">
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

            <CreateChatModal opened={createModalOpen} onClose={() => setCreateModalOpen(false)}/>
        </Box>
    );
}
