import {Box, Container, Group, Paper, rem, ScrollArea, SimpleGrid, Stack, Text, ThemeIcon, Title} from '@mantine/core';
import {IconMessagePlus, IconMessages, IconUsers} from '@tabler/icons-react';
import {CreateRoomForm} from '../components/CreateRoomForm.tsx';
import {useSessionStore} from '../stores/sessionStore.ts';

export default function Rooms() {
    const {user} = useSessionStore();

    return (
        <ScrollArea h="100%" w="100%">
            <Container size="lg" py="xl">
                <Stack gap="xl">
                    <Box>
                        <Title order={1} fw={900} style={{fontSize: rem(42)}}>
                            Welcome back, {user?.username || 'Pilot'}!
                        </Title>
                        <Text c="dimmed" size="lg" maw={600}>
                            Lunar is your space to connect, collaborate, and chat.
                            Start by joining an existing room or create your own space.
                        </Text>
                    </Box>

                    <SimpleGrid cols={{base: 1, sm: 2}} spacing="xl">
                        <Stack gap="xl">
                            <Paper p="xl" radius="lg" withBorder shadow="sm">
                                <Group mb="md">
                                    <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                                        <IconMessagePlus size={20}/>
                                    </ThemeIcon>
                                    <Title order={3}>Quick Actions</Title>
                                </Group>
                                <CreateRoomForm/>
                            </Paper>
                        </Stack>

                        <Stack gap="md">
                            <Paper p="xl" radius="lg" withBorder shadow="sm" h="100%">
                                <Title order={3} mb="xl">Platform Overview</Title>
                                <Stack gap="lg">
                                    <StatsItem
                                        icon={<IconUsers size={24}/>}
                                        label="Active Users"
                                        value="1,280"
                                        color="teal"
                                    />
                                    <StatsItem
                                        icon={<IconMessages size={24}/>}
                                        label="Total Messages"
                                        value="45.2k"
                                        color="blue"
                                    />
                                </Stack>
                            </Paper>
                        </Stack>
                    </SimpleGrid>
                </Stack>
            </Container>
        </ScrollArea>
    );
}


function StatsItem({icon, label, value, color}: {
    icon: React.ReactNode,
    label: string,
    value: string,
    color: string
}) {
    return (
        <Group justify="space-between">
            <Group>
                <ThemeIcon variant="light" color={color} size="md" radius="sm">
                    {icon}
                </ThemeIcon>
                <Text size="sm" fw={500}>{label}</Text>
            </Group>
            <Text fw={700}>{value}</Text>
        </Group>
    );
}


