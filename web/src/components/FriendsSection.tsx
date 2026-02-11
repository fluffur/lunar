import { useState, useEffect } from 'react';
import {
    Group,
    Stack,
    Text,
    Title,
    Paper,
    Container,
    ScrollArea,
    Flex,
    Box
} from '@mantine/core';
import { IconMessage } from '@tabler/icons-react';
import { roomApi } from '../api';
import type { ModelRoom } from '../../api';
import { ChatView } from './ChatView';
import { useMediaQuery } from '@mantine/hooks';
import { getRoomDisplayName } from '../utils/room.ts';
import { useSessionStore } from '../stores/sessionStore.ts';
import { RoomAvatar } from './RoomAvatar.tsx';

export function FriendsSection() {
    const [directChatRooms, setDirectChatRooms] = useState<ModelRoom[]>([]);
    const [selectedChatSlug, setSelectedChatSlug] = useState<string | null>(null);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [hoveredChatSlug, setHoveredChatSlug] = useState<string | null>(null);
    const { user } = useSessionStore();

    const loadRooms = async () => {
        try {
            const { data } = await roomApi.roomsGet();
            // Фильтруем прямые чаты (комнаты без имени)
            const directChats = (data.rooms || []).filter(room => !room.name || room.name === '');
            setDirectChatRooms(directChats);
        } catch (err) {
            console.error('Failed to load rooms', err);
        }
    };

    useEffect(() => {
        loadRooms();
    }, []);

    const handleChatClick = (roomSlug: string) => {
        setSelectedChatSlug(roomSlug);
    };

    return (
        <Flex h="100%" w="100%" gap="md" style={{ overflow: 'hidden' }}>
            <Box
                style={{
                    width: isMobile ? (selectedChatSlug ? 0 : '100%') : (selectedChatSlug ? 350 : '100%'),
                    transition: 'width 0.3s ease',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: selectedChatSlug && isMobile ? 'none' : 'block'
                }}
            >
                <ScrollArea h="100%" w="100%">
                    <Container size="sm" py="xl">
                        <Stack gap="lg">
                            <Group>
                                <IconMessage size={24} />
                                <Title order={2}>Chats</Title>
                            </Group>

                            {directChatRooms.length === 0 ? (
                                <Paper p="xl" withBorder radius="md">
                                    <Text c="dimmed" ta="center">
                                        No chats yet. Start a call with a friend to create a chat.
                                    </Text>
                                </Paper>
                            ) : (
                                <Stack gap="sm">
                                    {directChatRooms.map((room) => {
                                        const displayName = getRoomDisplayName(room, user?.id);
                                        return (
                                            <Paper
                                                key={room.id}
                                                p="md"
                                                shadow="sm"
                                                radius="md"
                                                style={{
                                                    cursor: 'pointer',
                                                    backgroundColor: selectedChatSlug === room.slug || hoveredChatSlug === room.slug
                                                        ? 'var(--mantine-color-dark-6)'
                                                        : undefined
                                                }}
                                                onMouseEnter={() => setHoveredChatSlug(room.slug)}
                                                onMouseLeave={() => setHoveredChatSlug(null)}
                                                onClick={() => handleChatClick(room.slug)}
                                            >
                                                <Group>
                                                    <RoomAvatar
                                                        room={room}
                                                        currentUserId={user?.id}
                                                        size={40}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <Text fw={500}>{displayName}</Text>
                                                        <Text size="sm" c="dimmed">
                                                            Click to view messages
                                                        </Text>
                                                    </div>
                                                </Group>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Stack>
                    </Container>
                </ScrollArea>
            </Box>

            {selectedChatSlug && (
                <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    {isMobile && (
                        <Paper p="sm" withBorder radius="md" mb="md">
                            <Group>
                                <Text
                                    size="sm"
                                    c="blue"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSelectedChatSlug(null)}
                                >
                                    ← Back to chats
                                </Text>
                            </Group>
                        </Paper>
                    )}
                    <ChatView roomSlug={selectedChatSlug} />
                </Box>
            )}
        </Flex>
    );
}
