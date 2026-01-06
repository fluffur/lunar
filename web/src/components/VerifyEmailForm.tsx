import { useForm } from '@mantine/form'
import { Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { authApi } from "../api.ts";
import axios from "axios";
import { useEffect, useState } from "react";
import { IconCheck, IconX } from "@tabler/icons-react";

interface VerifyEmailFormProps {
    initialEmail?: string;
    initialCode?: string;
    onSuccess: () => void;
    autoVerify?: boolean;
    fixedEmail?: boolean;
    minimal?: boolean;
    autoResend?: boolean;
}

export default function VerifyEmailForm({
    initialEmail = '',
    initialCode = '',
    onSuccess,
    autoVerify = false,
    fixedEmail = false,
    minimal = false,
    autoResend = false
}: VerifyEmailFormProps) {
    const [generalError, setGeneralError] = useState<string | null>(null)
    const [resendSuccess, setResendSuccess] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resending, setResending] = useState(false);
    const [attemptsError, setAttemptsError] = useState(false);

    const form = useForm({
        initialValues: { email: initialEmail, code: initialCode },
        validate: {
            email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Invalid email'),
            code: (v) => (v.length > 0 ? null : 'Enter code'),
        },
    });

    const verify = async (email: string, code: string) => {
        setVerifying(true);
        setGeneralError(null);
        try {
            await authApi.authVerifyPost({ email, code });
            onSuccess();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.data?.error?.fields) {
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
            setResendSuccess(true);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                form.setErrors(error.response?.data?.error?.fields ?? [])
                setGeneralError(error.response?.data?.error?.message || 'Resend failed');
                return
            }
            throw error
        } finally {
            setResending(false);
        }
    };

    useEffect(() => {
        if (autoVerify && initialEmail && initialCode) {
            verify(initialEmail, initialCode);
        }
        if (autoResend && initialEmail && !initialCode) {
            resendCode();
        }
    }, []);

    const handleSubmit = async (values: typeof form.values) => {
        await verify(values.email, values.code);
    }

    return (
        <Stack>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    {generalError && (
                        <Group gap="xs" c="red">
                            <IconX size={16} />
                            <Text c="red" size="sm">{generalError}</Text>
                        </Group>
                    )}
                    {resendSuccess && (
                        <Group gap="xs" c="green">
                            <IconCheck size={16} />
                            <Text c="green" size="sm">New code sent!</Text>
                        </Group>
                    )}
                    {!minimal && (
                        <TextInput
                            label="Email"
                            placeholder="your@email.com"
                            size="md"
                            {...form.getInputProps('email')}
                            disabled={fixedEmail}
                        />
                    )}
                    <TextInput
                        label="Verification Code"
                        placeholder="Enter code"
                        size="md"
                        {...form.getInputProps('code')}
                    />
                    <Button type="submit" fullWidth size="md" loading={verifying} disabled={attemptsError}>
                        Verify
                    </Button>
                    <Button variant="subtle" fullWidth size="sm" onClick={resendCode} loading={resending}>
                        Resend Code
                    </Button>
                </Stack>
            </form>
        </Stack>
    )
}
