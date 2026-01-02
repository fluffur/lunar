import { useState } from 'react';
import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { roomApi } from "../api.ts";
import type {RoomCreateRequest} from "../../api";

interface CreateRoomModalProps {
    opened: boolean;
    onClose: () => void;
}

export function CreateRoomModal({ opened, onClose }: CreateRoomModalProps) {
    const [roomId, setRoomId] = useState('');
    const [newRoomName, setNewRoomName] = useState('');
    const navigate = useNavigate();

    const handleJoinRoom = () => {
        if (!roomId) return;
        navigate(`/r/${roomId}`);
        onClose();
    };

    const handleCreateRoom = async () => {
        try {
            const params: RoomCreateRequest = {}
            if (newRoomName) {
                params.name = newRoomName
            }
            const { data } = await roomApi.roomsPost(params);
            if (data.id) {
                navigate(`/r/${data.id}`);
                onClose();
            }
        } catch (error) {
            console.error("Failed to create room", error);
        }
    };

    const handleChange = (value: string) => {
        const validValue = value.replace(/[^a-z0-9-]/gi, '');
        setRoomId(validValue);
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Create or Join room" centered>
            <Stack>
                <TextInput
                    label="Join existing room"
                    placeholder="Enter room ID"
                    description="Enter room url to join an existing room"
                    value={roomId}
                    onChange={(event) => handleChange(event.currentTarget.value)}
                />

                <Button
                    fullWidth
                    onClick={handleJoinRoom}
                    disabled={!roomId}
                >
                    Join Room
                </Button>

                <Text c="dimmed" size="sm" ta="center">
                    or
                </Text>
                <TextInput
                    label="Room name"
                    description="Optional"
                    placeholder="cool room name"
                    value={newRoomName}
                    onChange={(event) => setNewRoomName(event.currentTarget.value)}
                />

                <Button
                    fullWidth
                    variant="outline"
                    onClick={handleCreateRoom}
                >
                    Create a new Room
                </Button>
            </Stack>
        </Modal>
    );
}
