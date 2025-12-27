import {Avatar, Loader} from "@mantine/core";
import {API_BASE_URL} from "../config.ts";

interface AvatarUserProps {
    username: string;
    avatarUrl?: string | null;
    size?: number;
    onClick?: () => void;
    loading?: boolean;
}

export function UserAvatar({username, avatarUrl, size = 40, onClick, loading}: AvatarUserProps) {
    return (
        <Avatar
            src={avatarUrl ? API_BASE_URL + "/uploads/avatars/" + avatarUrl : undefined}
            radius="xl"
            size={size}
            variant="filled"
            style={{cursor: onClick ? "pointer" : "default", transition: 'all 0.3s ease-in-out'}}
            onClick={onClick}
        >
            {loading ? <Loader size="sm"/> : username.slice(0, 2).toUpperCase()}
        </Avatar>
    );
}
