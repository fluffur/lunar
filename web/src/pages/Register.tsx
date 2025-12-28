import {useForm} from '@mantine/form'
import {Anchor, Button, Center, Group, Paper, PasswordInput, Stack, Text, TextInput, Title} from '@mantine/core'
import {authApi, userApi} from "../api.ts";
import {useSessionStore} from "../stores/sessionStore.ts";
import {Link, useNavigate} from "react-router-dom";
import axios from "axios";
import {useState} from "react";

export default function Register() {
    const [generalError, setGeneralError] = useState<string | null>(null)

    const form = useForm({
        initialValues: {username: '', email: '', password: '', confirmPassword: ''},
        validate: {
            username: (v) => (!v ? 'Enter username' : !/^[a-zA-Z0-9_]{3,}$/.test(v) ? 'Username should be correct' : null),
            email: (v) => (!v ? 'Enter email' : null),
            password: (v) => (v.length >= 6 ? null : 'Password should be at least 6 characters'),
            confirmPassword: (v, values) => (v === values.password ? null : 'Passwords do not match'),
        },
    })

    const {setToken, setUser} = useSessionStore();
    const navigate = useNavigate();

    const handleSubmit = async (user: typeof form.values) => {
        try {
            const {data} = await authApi.authRegisterPost(user)

            const token = data.accessToken;
            setToken(token ?? "");

            const {data: userData} = await userApi.usersMeGet()
            setUser(userData);

            navigate('/chats')
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
    return (
        <Center h="90vh">
            <Paper withBorder shadow="xl" p="xl" radius="lg" mx="auto" maw={500} w="100%">
                <Title order={2} ta="center" mb="lg">
                    Create account
                </Title>

                <Stack>
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack>
                            {generalError && <Text color="red">{generalError}</Text>}

                            <TextInput placeholder="username" size="lg" {...form.getInputProps('username')} />
                            <TextInput type="email" placeholder="email" size="lg" {...form.getInputProps('email')} />
                            <PasswordInput placeholder="input password" size="lg" {...form.getInputProps('password')} />
                            <PasswordInput placeholder="confirm password"
                                           size="lg" {...form.getInputProps('confirmPassword')} />
                            <Button type="submit" fullWidth size="lg">
                                Register
                            </Button>
                        </Stack>
                    </form>
                </Stack>

                <Group mt="md">
                    <Text size="sm">
                        Already have an account?{' '}
                        <Anchor component={Link} to="/login">
                            Sign in
                        </Anchor>
                    </Text>
                </Group>
            </Paper>
        </Center>
    )
}
