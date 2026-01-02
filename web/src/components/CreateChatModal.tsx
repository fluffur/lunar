import { useState } from 'react';
import { Button, Modal, Stack, Text, TextInput } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { chatApi } from "../api.ts";

interface CreateChatModalProps {
    opened: boolean;
    onClose: () => void;
}

export function CreateChatModal({ opened, onClose }: CreateChatModalProps) {
    const [chatId, setChatId] = useState('');
    const navigate = useNavigate();

    const handleJoinChat = () => {
        if (!chatId) return;
        navigate(`/chats/${chatId}`);
        onClose();
    };

    const handleCreateChat = async () => {
        try {
            const { data } = await chatApi.chatsPost({
                type: "public"
            });
            if (data.id) {
                navigate(`/chats/${data.id}`);
                onClose();
            }
        } catch (error) {
            console.error("Failed to create room", error);
        }
    };

    const handleChange = (value: string) => {
        const validValue = value.replace(/[^a-z0-9-]/gi, '');
        setChatId(validValue);
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Create or Join Chat" centered>
            <Stack>
                <TextInput
                    label="Join existing chat"
                    placeholder="Enter chat ID"
                    description="Enter chat url to join an existing chat"
                    value={chatId}
                    onChange={(event) => handleChange(event.currentTarget.value)}
                />

                <Button
                    fullWidth
                    onClick={handleJoinChat}
                    disabled={!chatId}
                >
                    Join Chat
                </Button>

                <Text c="dimmed" size="sm" ta="center">
                    or
                </Text>
                <Button
                    fullWidth
                    variant="outline"
                    onClick={handleCreateChat}
                >
                    Create a new Chat
                </Button>
            </Stack>
        </Modal>
    );
}
