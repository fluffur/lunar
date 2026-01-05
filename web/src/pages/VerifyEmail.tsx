import { Anchor, Center, Group, Paper, Stack, Title, Text, Button } from '@mantine/core'
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { IconCheck } from "@tabler/icons-react";
import VerifyEmailForm from "../components/VerifyEmailForm.tsx";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const emailParam = searchParams.get('email') || '';
    const codeParam = searchParams.get('code') || '';

    const handleSuccess = () => {
        setSuccess(true);
        setTimeout(() => {
            navigate('/login');
        }, 3000);
    };

    if (success) {
        return (
            <Center h="90vh">
                <Paper withBorder shadow="xl" p="xl" radius="lg" mx="auto" maw={500} w="100%">
                    <Stack align="center" gap="md">
                        <IconCheck size={50} color="green" />
                        <Title order={2}>Verified!</Title>
                        <Text>Your email has been successfully verified.</Text>
                        <Text size="sm" c="dimmed">Redirecting to login...</Text>
                        <Button component={Link} to="/login">Go to Login</Button>
                    </Stack>
                </Paper>
            </Center>
        )
    }

    return (
        <Center h="90vh">
            <Paper withBorder shadow="xl" p="xl" radius="lg" mx="auto" maw={500} w="100%">
                <Title order={2} ta="center" mb="lg">
                    Verify Email
                </Title>

                <VerifyEmailForm
                    initialEmail={emailParam}
                    initialCode={codeParam}
                    onSuccess={handleSuccess}
                    autoVerify={!!(emailParam && codeParam)}
                    fixedEmail={false}
                />

                <Group mt="md" justify="center">
                    <Anchor component={Link} to={"/login"} size="sm">
                        Back to Login
                    </Anchor>
                </Group>
            </Paper>
        </Center>
    )
}
