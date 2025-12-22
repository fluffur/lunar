import {Button, Container, Group, Title, Text} from "@mantine/core";
import { Link } from "react-router-dom";

export default function Home() {
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
                <Text component="span" variant="gradient" gradient={{from: 'violet', to: 'blue'}} inherit>
                    Lunar
                </Text>
            </Title>
            <Text c="dimmed" size="xl" maw={600} mx="auto" mb={50}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
            <Group>
                <Button size="xl" variant="gradient" gradient={{from: 'violet', to: 'blue'}} component={Link} to="/register">
                    Get Started
                </Button>
                <Button size="xl" variant="default" component={Link} to="/login " >
                    Sign In
                </Button>
            </Group>
        </Container>
    )
}