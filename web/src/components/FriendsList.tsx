import {Group, Menu, Paper, Stack, Text, ActionIcon} from '@mantine/core';
import {IconDots, IconPhone, IconUserMinus} from "@tabler/icons-react";
import {UserAvatar} from "./UserAvatar.tsx";

interface Friend {
    id: string;
    username: string;
    avatarUrl?: string | null;
}

interface FriendsListProps {
    friends: Friend[];
    onCall: (friendId: string) => void;
    onRemoveFriend: (friendId: string) => void;
    openedMenuId: string | null;
    onMenuChange: (id: string | null) => void;
    hoveredFriendId: string | null;
    onHover: (id: string | null) => void;
}

export function FriendsList({
    friends,
    onCall,
    onRemoveFriend,
    openedMenuId,
    onMenuChange,
    hoveredFriendId,
    onHover
}: FriendsListProps) {
    return (
        <Stack gap="sm" py="md" px={0}>
            {friends.map((friend) => (
                <Menu 
                    key={friend.id} 
                    position="bottom-end" 
                    withArrow 
                    opened={openedMenuId === friend.id}
                    onChange={(opened) => onMenuChange(opened ? friend.id : null)}
                >
                    <Menu.Target>
                        <Paper 
                            p="md"
                            shadow="sm"
                            radius="md"
                            style={{ 
                                cursor: 'pointer',
                                backgroundColor: hoveredFriendId === friend.id 
                                    ? 'var(--mantine-color-dark-6)' 
                                    : undefined
                            }}
                            onMouseEnter={() => onHover(friend.id)}
                            onMouseLeave={() => onHover(null)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                onMenuChange(friend.id);
                            }}
                        >
                            <Group justify="space-between">
                                <Group>
                                    <UserAvatar
                                        username={friend.username}
                                        avatarUrl={friend.avatarUrl}
                                        size={48}
                                    />
                                    <div>
                                        <Text fw={500} size="md">{friend.username}</Text>
                                    </div>
                                </Group>
                                <ActionIcon
                                    variant="subtle"
                                    color="gray"
                                    size="md"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMenuChange(friend.id);
                                    }}
                                >
                                    <IconDots size={18}/>
                                </ActionIcon>
                            </Group>
                        </Paper>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item
                            leftSection={<IconPhone size={16} />}
                            onClick={() => {
                                onCall(friend.id);
                                onMenuChange(null);
                            }}
                        >
                            Позвонить
                        </Menu.Item>
                        <Menu.Item
                            leftSection={<IconUserMinus size={16} />}
                            color="red"
                            onClick={() => {
                                onRemoveFriend(friend.id);
                                onMenuChange(null);
                            }}
                        >
                            Удалить из друзей
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            ))}
            {friends.length === 0 && (
                <Text c="dimmed" size="sm" ta="center" py="xl">
                    No friends yet
                </Text>
            )}
        </Stack>
    );
}

