import { Center, Stack, Text, Title } from '@mantine/core';

export default function Chats() {
    return (
        <Center h="100%" w="100%">
            <Stack align="center" gap="xs">
                <Title order={2} c="dimmed">Select a chat</Title>
                <Text c="dimmed">Choose a chat from the sidebar or create a new one to start messaging</Text>
            </Stack>
        </Center>
    );
}
