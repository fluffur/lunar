import { useForm } from '@mantine/form'
import { Anchor, Button, Center, Group, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core'
import { Link, useNavigate } from "react-router-dom";
import { authApi, userApi } from "../api.ts";
import { useSessionStore } from "../stores/sessionStore.ts";
import axios from "axios";
import { useState } from "react";
import VerifyEmailForm from "../components/VerifyEmailForm.tsx";


export default function Login() {
    const [generalError, setGeneralError] = useState<string | null>(null)
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

    const form = useForm({
        initialValues: { login: '', password: '' },
        validate: {
            login: (v) => {
                if (!v) return 'Enter login';
                const isUsername = /^[a-zA-Z0-9_]{3,}$/.test(v);
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                return isUsername || isEmail ? null : 'Login should be a valid username or email';
            },
            password: (v) => (v.length >= 6 ? null : 'Password should be at least 6 characters'),
        },
    });

    const navigate = useNavigate();
    const { setToken, setUser } = useSessionStore();

    const handleSubmit = async (loginFormData: typeof form.values) => {
        try {
            setGeneralError(null);
            const { data } = await authApi.authLoginPost(loginFormData)
            const token = data.accessToken;
            setToken(token);

            const { data: userData } = await userApi.usersMeGet()
            setUser(userData);

            navigate('/rooms')
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errors = error.response?.data?.error?.fields;
                if (errors) {
                    form.setErrors(errors);
                    return;
                }
                const message = error.response?.data?.error?.message ?? 'Login failed';
                if (message === "email is not verified") {
                    setUnverifiedEmail(loginFormData.login);
                }
                setGeneralError(message)
            }
            throw error;
        }

    }

    const handleVerifySuccess = async () => {
        setUnverifiedEmail(null);
        await handleSubmit(form.values);
    };

    return (
        <Center mih="calc(100vh - 80px)" py="xl">
            <Paper withBorder shadow="xl" p="xl" radius="lg" mx="auto" maw={450} w="100%">
                <Title order={2} ta="center" mb="md">
                    Sign in
                </Title>

                <Stack gap="sm">
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="xs">
                            {generalError && <Text c="red" size="sm">{generalError}</Text>}
                            <TextInput
                                label="Login"
                                placeholder="email or username"
                                size="md"
                                {...form.getInputProps('login')}
                                disabled={!!unverifiedEmail}
                            />
                            <PasswordInput
                                label="Password"
                                placeholder="input password"
                                size="md"
                                {...form.getInputProps('password')}
                                disabled={!!unverifiedEmail}
                            />
                            <Button type="submit" fullWidth size="md" mt="xs" disabled={!!unverifiedEmail}>
                                Login
                            </Button>
                        </Stack>
                    </form>

                    {unverifiedEmail && (
                        <Paper withBorder p="sm" mt="sm" bg="var(--mantine-color-blue-light)">
                            <Text size="sm" mb="xs" fw={500}>Verification required</Text>
                            <VerifyEmailForm
                                initialEmail={unverifiedEmail}
                                onSuccess={handleVerifySuccess}
                                minimal
                            />
                        </Paper>
                    )}
                </Stack>

                <Group mt="md" justify="center">
                    <Text size="sm">
                        {"Don't have an account?"}{' '}
                        <Anchor component={Link} to={"/register"}>
                            Register
                        </Anchor>
                    </Text>
                </Group>
            </Paper>
        </Center>
    )
}
