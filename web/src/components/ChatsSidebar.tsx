import { useEffect, useState } from 'react';
import { ActionIcon, Box, Group, NavLink, Paper, ScrollArea, Stack, Text, Title } from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { chatApi } from "../api.ts";
import type { ModelChat } from "../../api";
import { IconPlus } from "@tabler/icons-react";
import { CreateChatModal } from "./CreateChatModal.tsx";

export function ChatsSidebar() {
    const [chats, setChats] = useState<ModelChat[]>([]);
    const { chatId } = useParams<{ chatId: string }>();
    const navigate = useNavigate();
    const [createModalOpen, setCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const { data } = await chatApi.chatsGet();
                setChats(data.chats || []);
            } catch (error) {
                console.error("Failed to fetch chats", error);
            }
        };

        fetchChats();
    }, []);

    return (
        <Box h="100%" p="md">
            <Paper h="100%" shadow="xl" radius="lg" withBorder p="md" display="flex" style={{ flexDirection: 'column' }}>
                <Group justify="space-between" mb="md">
                    <Title order={3}>Chats</Title>
                    <ActionIcon variant="light" size="lg" onClick={() => setCreateModalOpen(true)}>
                        <IconPlus size={20} />
                    </ActionIcon>
                </Group>
                <ScrollArea style={{ flex: 1 }}>
                    <Stack gap="xs">
                        {chats.map((chat) => (
                            <NavLink
                                key={chat.id}
                                label={chat.id}
                                active={chat.id === chatId}
                                onClick={() => navigate(`/chats/${chat.id}`)}
                                variant="filled"
                                color="var(--mantine-color-dark-6)"
                                style={{ borderRadius: 'var(--mantine-radius-sm)' }}
                            />
                        ))}
                        {chats.length === 0 && (
                            <Text c="dimmed" size="sm" ta="center">No chats found</Text>
                        )}
                    </Stack>
                </ScrollArea>
            </Paper>
            <CreateChatModal opened={createModalOpen} onClose={() => setCreateModalOpen(false)} />
        </Box>
    );
}
