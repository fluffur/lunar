import {useState} from 'react';
import {Button, Center, Stack, Text, TextInput, Title} from '@mantine/core';
import {useNavigate} from 'react-router-dom';
import {api} from "../api.ts";

export default function Chats() {
    const [chatId, setChatId] = useState('');
    const navigate = useNavigate();

    const handleJoinChat = () => {
        if (!chatId) return;
        navigate(`/chats/${chatId}`);
    };

    const handleCreateChat = async () => {
        const {data} = await api.post("/chats", {
            type: "public"
        })

        navigate(`/chats/${data.id}`);
    };

    const handleChange = (value: string) => {
        const validValue = value.replace(/[^a-z0-9-]/gi, '');
        setChatId(validValue);
    };

    return (
        <Center h="90vh">
            <Stack w={300}>
                <Title order={1}>Chat form</Title>

                <TextInput
                    description="Enter chat url to join an existing chat"
                    value={chatId}
                    size="lg"
                    onChange={(event) => handleChange(event.currentTarget.value)}
                />


                <Button
                    fullWidth
                    size="lg"
                    color="violet"
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
                    size="lg"
                    variant="outline"
                    color="violet"
                    onClick={handleCreateChat}
                >
                    Create a new Chat
                </Button>
            </Stack>
        </Center>
    );
}
