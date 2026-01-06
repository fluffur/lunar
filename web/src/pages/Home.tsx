import {Button, Container, Group, Text, Title, SimpleGrid} from "@mantine/core";
import {Link} from "react-router-dom";
import {useSessionStore} from "../stores/sessionStore.ts";
import {FriendsSection} from "../components/FriendsSection.tsx";

export default function Home() {
    const {user} = useSessionStore();

    if (user) {
        return (
            <Container size="lg" py="xl">
                <SimpleGrid cols={{base: 1, md: 2}} spacing="xl">
                    <div>
                        <Title order={1} mb="md">
                            Welcome back, {user.username}!
                        </Title>
                        <Text c="dimmed" size="lg" mb="xl">
                            Manage your friends, send requests, and stay connected with your community.
                        </Text>
                        <Button size="lg" component={Link} to="/rooms">
                            Go to Rooms
                        </Button>
                    </div>
                    <FriendsSection />
                </SimpleGrid>
            </Container>
        );
    }

    return (
        <Container size="md" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100vh - 80px)',
            textAlign: 'center'
        }}>
            <Title
                order={1}
                style={{
                    fontSize: 60,
                    fontWeight: 900,
                    letterSpacing: -2,
                    lineHeight: 1.1,
                    marginBottom: 30,
                    color: 'white'
                }}
            >
                Connect with{' '}
                <Text component="span" inherit>
                    Lunar
                </Text>
            </Title>
            <Text c="dimmed" size="xl" maw={600} mx="auto" mb={50}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                dolore magna aliqua.
            </Text>
            <Group>
                <Button size="xl" component={Link} to="/register">
                    Get Started
                </Button>
                <Button size="xl" variant="default" component={Link} to="/login">
                    Sign In
                </Button>
            </Group>
        </Container>
    )
}