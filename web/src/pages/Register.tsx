import { useForm } from '@mantine/form'
import { Anchor, Button, Center, Group, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { authApi, userApi } from "../api.ts";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import VerifyEmailForm from "../components/VerifyEmailForm.tsx";
import { useSessionStore } from "../stores/sessionStore.ts";

export default function Register() {
    const [generalError, setGeneralError] = useState<string | null>(null)
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

    const form = useForm({
        initialValues: { username: '', email: '', password: '', confirmPassword: '' },
        validate: {
            username: (v) => (!v ? 'Enter username' : !/^[a-zA-Z0-9_]{3,}$/.test(v) ? 'Username should be correct' : null),
            email: (v) => (!v ? 'Enter email' : null),
            password: (v) => (v.length >= 6 ? null : 'Password should be at least 6 characters'),
            confirmPassword: (v, values) => (v === values.password ? null : 'Passwords do not match'),
        },
    })

    const navigate = useNavigate();
    const { setToken, setUser } = useSessionStore();

    const handleSubmit = async (user: typeof form.values) => {
        try {
            await authApi.authRegisterPost(user)
            setRegisteredEmail(user.email);
            setGeneralError(null);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errors = error.response?.data?.error?.fields;
                if (errors) {
                    form.setErrors(errors)
                } else {
                    const message = error.response?.data?.error?.message ?? 'Registration failed';
                    setGeneralError(message)
                }
            }
            throw error
        }

    }

    const handleVerifySuccess = async () => {
        try {
            // Silently login using the registration credentials
            const { data } = await authApi.authLoginPost({
                login: form.values.username,
                password: form.values.password
            });
            setToken(data.accessToken);

            const { data: userData } = await userApi.usersMeGet();
            setUser(userData);

            navigate('/rooms');
        } catch (error) {
            console.error('Auto-login failed after verification:', error);
            navigate('/login');
        }
    };

    return (
        <Center mih="calc(100vh - 80px)" py="xl">
            <Paper withBorder shadow="xl" p="xl" radius="lg" mx="auto" maw={500} w="100%">
                <Title order={2} ta="center" mb="md">
                    Create account
                </Title>

                <Stack gap="sm">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="xs">
                            {generalError && <Text c="red" size="sm">{generalError}</Text>}

                            <Group grow gap="xs">
                                <TextInput
                                    label="Username"
                                    placeholder="your username"
                                    size="md"
                                    {...form.getInputProps('username')}
                                    disabled={!!registeredEmail}
                                />
                                <TextInput
                                    label="Email"
                                    type="email"
                                    placeholder="your@email.com"
                                    size="md"
                                    {...form.getInputProps('email')}
                                    disabled={!!registeredEmail}
                                />
                            </Group>

                            <Group grow gap="xs">
                                <PasswordInput
                                    label="Password"
                                    placeholder="create password"
                                    size="md"
                                    {...form.getInputProps('password')}
                                    disabled={!!registeredEmail}
                                />
                                <PasswordInput
                                    label="Confirm Password"
                                    placeholder="repeat password"
                                    size="md"
                                    {...form.getInputProps('confirmPassword')}
                                    disabled={!!registeredEmail}
                                />
                            </Group>

                            <Button type="submit" fullWidth size="md" mt="xs" disabled={!!registeredEmail}>
                                Register
                            </Button>
                        </Stack>
                    </form>

                    {registeredEmail && (
                        <Paper withBorder p="sm" mt="sm" bg="">
                            <Text size="sm" mb="xs" fw={500}>Registration successful! Please verify your email.</Text>
                            <VerifyEmailForm
                                initialEmail={registeredEmail}
                                onSuccess={handleVerifySuccess}
                                minimal
                            />
                        </Paper>
                    )}
                </Stack>

                <Group mt="md" justify="center">
                    <Text size="sm">
                        {"Already have an account?"}{' '}
                        <Anchor component={Link} to="/login">
                            Sign in
                        </Anchor>
                    </Text>
                </Group>
            </Paper>
        </Center>
    )
}
