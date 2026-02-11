import type { ModelRoom } from "../../api";

export function getRoomDisplayName(room: ModelRoom, currentUserId?: string): string {
    if (room.name) {
        return room.name;
    }

    if (!room.members || room.members.length === 0) {
        return room.slug || 'Unknown Room';
    }

    if (room.members.length === 2) {
        const otherMember = room.members.find(m => m.user_id !== currentUserId);
        return otherMember?.username || 'Chat';
    }

    if (room.members.length > 2) {
        return room.members
            .map(m => m.username)
            .filter(Boolean)
            .join(', ');
    }

    return room.slug || 'Unknown Room';
}
