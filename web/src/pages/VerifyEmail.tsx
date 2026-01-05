
import { useForm } from '@mantine/form'
import { Anchor, Button, Center, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api.ts";
import axios from "axios";
import { useEffect, useState } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";


export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [generalError, setGeneralError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [attemptsError, setAttemptsError] = useState(false);

    const emailParam = searchParams.get('email');
    const codeParam = searchParams.get('code');

    const form = useForm({
        initialValues: { email: emailParam || '', code: codeParam || '' },
        validate: {
            email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Invalid email'),
            code: (v) => (v.length > 0 ? null : 'Enter code'),
        },
    });

    const navigate = useNavigate();

    const verify = async (email: string, code: string) => {
        setVerifying(true);
        setGeneralError(null);
        try {
            await authApi.authVerifyPost({ email, code });
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400 && error.response?.data?.error?.fields) {
                    form.setErrors(error.response.data.error.fields);
                } else if (error.response?.status === 429) {
                    setGeneralError("Too many attempts. Please resend code.");
                    setAttemptsError(true);
                } else {
                    setGeneralError(error.response?.data?.error?.message || 'Verification failed');
                }
            } else {
                setGeneralError('An unexpected error occurred');
            }
        } finally {
            setVerifying(false);
        }
    };

    const resendCode = async () => {
        if (!form.values.email) {
            form.setFieldError('email', 'Email required');
            return;
        }
        setResending(true);
        setGeneralError(null);
        setAttemptsError(false);
        try {
            await authApi.authVerifyResendPost({ email: form.values.email });
            setGeneralError(null);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setGeneralError(error.response?.data?.error?.message || 'Resend failed');
                return
            }
            throw error
        } finally {
            setResending(false);
        }
    };

    useEffect(() => {
        if (emailParam && codeParam && !success && !generalError && !verifying) {
            verify(emailParam, codeParam);
        }
    }, [codeParam, emailParam, generalError, success, verify, verifying]);

    const handleSubmit = async (values: typeof form.values) => {
        await verify(values.email, values.code);
    }

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

                <Stack>
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack>
                            {generalError && (
                                <Group gap="xs" c="red">
                                    <IconX size={16} />
                                    <Text c="red" size="sm">{generalError}</Text>
                                </Group>
                            )}
                            <TextInput
                                label="Email"
                                placeholder="your@email.com"
                                size="lg"
                                {...form.getInputProps('email')}
                            />
                            <TextInput
                                label="Verification Code"
                                placeholder="Enter code"
                                size="lg"
                                {...form.getInputProps('code')}
                            />
                            <Button type="submit" fullWidth size="lg" loading={verifying} disabled={attemptsError}>
                                Verify
                            </Button>
                            <Button variant="subtle" fullWidth size="md" onClick={resendCode} loading={resending}>
                                Resend Code
                            </Button>
                        </Stack>
                    </form>
                </Stack>

                <Group mt="md" justify="center">
                    <Anchor component={Link} to={"/login"} size="sm">
                        Back to Login
                    </Anchor>
                </Group>
            </Paper>
        </Center>
    )
}
