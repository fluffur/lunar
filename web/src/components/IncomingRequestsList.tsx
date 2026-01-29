import {Group, Paper, Stack, Text, ActionIcon} from '@mantine/core';
import {IconCheck, IconX} from "@tabler/icons-react";
import {UserAvatar} from "./UserAvatar.tsx";

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

interface IncomingRequestsListProps {
    requests: FriendRequest[];
    onAccept: (fromId: string) => void;
    onReject: (fromId: string) => void;
}

export function IncomingRequestsList({
    requests,
    onAccept,
    onReject
}: IncomingRequestsListProps) {
    return (
        <Stack gap="sm" py="md" px={0}>
            {requests.map((request) => (
                <Paper 
                    key={`${request.fromUserId}-${request.toUserId}`}
                    p="md"
                    shadow="sm"
                    radius="md"
                >
                    <Group justify="space-between">
                        <Group>
                            <UserAvatar
                                username={request.fromUser?.username || ''}
                                avatarUrl={request.fromUser?.avatarUrl}
                                size={48}
                            />
                            <div>
                                <Text fw={500} size="md">{request.fromUser?.username}</Text>
                                {request.message && (
                                    <Text size="sm" c="dimmed">{request.message}</Text>
                                )}
                            </div>
                        </Group>
                        <Group gap="xs">
                            <ActionIcon
                                size="lg"
                                variant="light"
                                color="green"
                                onClick={() => onAccept(request.fromUserId)}
                            >
                                <IconCheck size={18} />
                            </ActionIcon>
                            <ActionIcon
                                size="lg"
                                variant="light"
                                color="red"
                                onClick={() => onReject(request.fromUserId)}
                            >
                                <IconX size={18} />
                            </ActionIcon>
                        </Group>
                    </Group>
                </Paper>
            ))}
            {requests.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" py="xl">
                    No incoming requests
                </Text>
            )}
        </Stack>
    );
}

