import {Avatar, Loader, type MantineRadius} from "@mantine/core";
import {API_AVATARS_BASE_URL} from "../config.ts";

interface AvatarUserProps {
    username: string;
    avatarUrl?: string | null;
    size?: number;
    onClick?: () => void;
    loading?: boolean;
    radius?: MantineRadius
}

export function UserAvatar({username, avatarUrl, size = 40, onClick, loading, radius = "xl"}: AvatarUserProps) {
    return (
        <Avatar
            src={avatarUrl ? API_AVATARS_BASE_URL + avatarUrl : undefined}
            radius={radius}
            size={size}
            variant="filled"
            style={{cursor: onClick ? "pointer" : "default", transition: 'all 0.3s ease-in-out'}}
            onClick={onClick}
        >
            {loading ? <Loader size="sm"/> : username.slice(0, 2).toUpperCase()}
        </Avatar>
    );
}
