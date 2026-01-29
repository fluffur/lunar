import { Box, type MantineRadius } from "@mantine/core";
import type { ModelRoom } from "../../api";
import { UserAvatar } from "./UserAvatar";

interface RoomAvatarProps {
    room: ModelRoom;
    currentUserId?: string;
    size?: number;
    radius?: MantineRadius;
}

export function RoomAvatar({ room, currentUserId, size = 40, radius = "xl" }: RoomAvatarProps) {
    const members = room.members || [];

    if (members.length === 2) {
        const otherMember = members.find(m => m.user_id !== currentUserId);
        return (
            <UserAvatar
                username={otherMember?.username || '?'}
                avatarUrl={otherMember?.avatar_url}
                size={size}
                radius={radius}
            />
        );
    }

    if (members.length > 2) {
        const collageMembers = members.slice(0, 4);
        const itemSize = size / 2;

        return (
            <Box style={{
                width: size,
                height: size,
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1px',
                borderRadius: radius === 'xl' ? '50%' : '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--mantine-color-gray-2)'
            }}>
                {collageMembers.map((m, i) => (
                    <UserAvatar
                        key={m.user_id || i}
                        username={m.username || '?'}
                        avatarUrl={m.avatar_url}
                        size={itemSize}
                        radius={0}
                    />
                ))}
            </Box>
        );
    }

    const firstMember = members[0];
    return (
        <UserAvatar
            username={room.name || room.slug || '?'}
            avatarUrl={firstMember?.avatar_url}
            size={size}
            radius={radius}
        />
    );
}
