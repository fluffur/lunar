import {useForm} from '@mantine/form'
import {Anchor, Button, Center, Group, Paper, PasswordInput, Stack, Text, TextInput, Title} from '@mantine/core'
import {Link, useNavigate} from "react-router-dom";
import {authApi, userApi} from "../api.ts";
import {useSessionStore} from "../stores/sessionStore.ts";
import axios from "axios";
import {useState} from "react";


export default function Login() {
    const [generalError, setGeneralError] = useState<string | null>(null)

    const form = useForm({
        initialValues: {login: '', password: ''},
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
    const {setToken, setUser} = useSessionStore();
    const handleSubmit = async (loginFormData: typeof form.values) => {
        try {
            setGeneralError(null);
            const {data} = await authApi.authLoginPost(loginFormData)
            const token = data.accessToken;
            setToken(token);

            const {data: userData} = await userApi.usersMeGet()
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
                setGeneralError(message)
            }
            throw error;
        }

    }

    return (
        <Center h="90vh">
            <Paper withBorder shadow="xl" p="xl" radius="lg" mx="auto" maw={500} w="100%">
                <Title order={2} ta="center" mb="lg">
                    Sign in
                </Title>

                <Stack>
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack>
                            {generalError && <Text color="red">{generalError}</Text>}
                            <TextInput placeholder="email or username" size="lg" {...form.getInputProps('login')} />
                            <PasswordInput placeholder="input password" size="lg" {...form.getInputProps('password')} />
                            <Button type="submit" fullWidth size="lg">
                                Login
                            </Button>
                        </Stack>
                    </form>
                </Stack>

                <Group mt="md">
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
