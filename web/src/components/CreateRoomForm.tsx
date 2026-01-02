import { useState } from 'react';
import { Button, Stack, TextInput, Divider } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { roomApi } from "../api.ts";
import type { RoomCreateRequest } from "../../api";

interface CreateRoomFormProps {
    onSuccess?: () => void;
}

export function CreateRoomForm({ onSuccess }: CreateRoomFormProps) {
    const [roomId, setRoomId] = useState('');
    const [newRoomName, setNewRoomName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleJoinRoom = () => {
        if (!roomId) return;
        navigate(`/r/${roomId}`);
        onSuccess?.();
    };

    const handleCreateRoom = async () => {
        setLoading(true);
        try {
            const params: RoomCreateRequest = {}
            if (newRoomName) {
                params.name = newRoomName
            }
            const { data } = await roomApi.roomsPost(params);
            if (data.slug) {
                navigate(`/r/${data.slug}`);
                onSuccess?.();
            }
        } catch (error) {
            console.error("Failed to create room", error);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinChange = (value: string) => {
        let slug = value;
        const match = value.match(/\/r\/([a-zA-Z0-9-]+)/);
        if (match) {
            slug = match[1];
        }
        const validValue = slug.replace(/[^a-z0-9-]/gi, '');
        setRoomId(validValue);
    };

    return (
        <Stack gap="md">
            <TextInput
                label="Join existing room"
                placeholder="Enter room ID or URL"
                description="Paste a link or type a room ID"
                value={roomId}
                onChange={(event) => handleJoinChange(event.currentTarget.value)}
                radius="md"
            />

            <Button
                fullWidth
                onClick={handleJoinRoom}
                disabled={!roomId}
                radius="md"
            >
                Join Room
            </Button>

            <Divider label="OR" labelPosition="center" my="xs" />

            <TextInput
                label="Create a new room"
                description="Give your room a name (optional)"
                placeholder="e.g. My Awesome Hangout"
                value={newRoomName}
                onChange={(event) => setNewRoomName(event.currentTarget.value)}
                radius="md"
            />

            <Button
                fullWidth
                variant="light"
                onClick={handleCreateRoom}
                loading={loading}
                radius="md"
            >
                Create Room
            </Button>
        </Stack>
    );
}
