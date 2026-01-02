import { Badge, Box, Group, ScrollArea, Stack, Text, Title, ActionIcon } from '@mantine/core';
import { useMemo } from 'react';
import { UserAvatar } from './UserAvatar';
import { IconX, IconPlayerPlay } from '@tabler/icons-react';

interface Member {
    id: string;
    username: string;
    avatarUrl?: string;
    status: 'online' | 'offline';
    playbackTime?: string;
    isBuffering?: boolean;
}

interface RoomMembersProps {
    roomSlug?: string;
    onClose?: () => void;
}

export function RoomMembers({ onClose }: RoomMembersProps) {
    const members: Member[] = useMemo(() => [
        { id: '1', username: 'yoworu', status: 'online', playbackTime: '00:12:45' },
        { id: '5', username: 'test', status: 'offline', playbackTime: '00:00:00' },
    ], []);

    const onlineCount = members.filter(m => m.status !== 'offline').length;

    return (
        <Box h="100%" p="md" display="flex" style={{ flexDirection: 'column' }}>
            <Group justify="space-between" mb="lg" wrap="nowrap">
                <Group gap="xs">
                    <Title order={5} fw={600} style={{ letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.8 }}>
                        Watchers
                    </Title>
                    <Badge variant="dot" color="teal" size="sm">
                        {onlineCount}
                    </Badge>
                </Group>
                {onClose && (
                    <ActionIcon variant="subtle" color="gray" onClick={onClose} radius="xl">
                        <IconX size={18} />
                    </ActionIcon>
                )}
            </Group>

            <ScrollArea style={{ flex: 1 }} offsetScrollbars scrollbarSize={4}>
                <Stack gap={4}>
                    {members.map((member) => (
                        <Group key={member.id} wrap="nowrap" gap="sm" p="xs" style={{
                            borderRadius: 'var(--mantine-radius-md)',
                            transition: 'all 0.2s ease',
                            cursor: 'default'
                        }}
                            className="member-item"
                        >
                            <Box style={{ position: 'relative' }}>
                                <UserAvatar username={member.username} avatarUrl={member.avatarUrl} size={32} />
                                <Box style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    backgroundColor: member.status == 'offline' ? 'var(--mantine-color-gray-filled)' : 'var(--mantine-color-teal-filled)',
                                    border: '2px solid var(--mantine-color-body)',
                                    zIndex: 1
                                }} />
                            </Box>

                            <Box style={{ flex: 1, overflow: 'hidden' }}>
                                <Text size="sm" fw={500} truncate>{member.username}</Text>
                                {member.isBuffering && (
                                    <Text size="xs" c="orange" fw={500} style={{ fontSize: '10px' }}>Buffering...</Text>
                                )}
                            </Box>

                            {member.playbackTime && (
                                    <Group
                                        gap={4}
                                        wrap="nowrap"
                                        px={8}
                                        py={2}
                                        style={{
                                            borderRadius: '4px',
                                            backgroundColor: 'var(--mantine-color-default-hover)',
                                            border: '1px solid var(--mantine-color-default-border)'
                                        }}
                                    >
                                        <IconPlayerPlay size={10} fill="currentColor" />
                                        <Text size="xs"  style={{ fontVariantNumeric: 'tabular-nums', }}>
                                            {member.playbackTime}
                                        </Text>
                                    </Group>
                            )}
                        </Group>
                    ))}
                </Stack>
            </ScrollArea>

        </Box>
    );
}
