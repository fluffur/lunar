import {Group, Paper, Stack, Text, ActionIcon} from '@mantine/core';
import {IconX} from "@tabler/icons-react";
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

interface OutgoingRequestsListProps {
    requests: FriendRequest[];
    onCancel: (toId: string) => void;
}

export function OutgoingRequestsList({
    requests,
    onCancel
}: OutgoingRequestsListProps) {
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
                                username={request.toUser?.username || ''}
                                avatarUrl={request.toUser?.avatarUrl}
                                size={48}
                            />
                            <div>
                                <Text fw={500} size="md">{request.toUser?.username}</Text>
                                {request.message && (
                                    <Text size="sm" c="dimmed">{request.message}</Text>
                                )}
                            </div>
                        </Group>
                        <ActionIcon
                            size="lg"
                            variant="light"
                            color="red"
                            onClick={() => onCancel(request.toUserId)}
                        >
                            <IconX size={18} />
                        </ActionIcon>
                    </Group>
                </Paper>
            ))}
            {requests.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" py="xl">
                    No outgoing requests
                </Text>
            )}
        </Stack>
    );
}

