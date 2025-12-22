import { Stack, TextInput, Text, Group, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { api } from "../api.ts";
import axios from "axios";

type Props = {
    onSuccess?: () => void;
    handlePasswordCancel?: () => void;
};

export default function ChangePasswordForm({ onSuccess, handlePasswordCancel }: Props) {
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const form = useForm({
        initialValues: {
            currentPassword: "",
            newPassword: "",
        },
        validate: {
            currentPassword: (v) => (v ? null : "Enter current password"),
            newPassword: (v) =>
                v.length >= 6 ? null : "New password must be at least 6 characters",
        },
    });

    const handleSubmit = async () => {
        setPasswordError(null);
        const values = form.values;

        try {
            await api.post("/users/me/password", {
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
            });
            form.reset();
            if (onSuccess) onSuccess();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errors = error.response?.data?.errors;
                form.setErrors(errors);
            } else {
                setPasswordError("Failed to change password");
                console.error(error);
            }
        }
    };

    return (
        <Stack w="100%">
            <TextInput
                type="password"
                placeholder="Current password"
                {...form.getInputProps("currentPassword")}
                w="100%"
            />
            <TextInput
                type="password"
                placeholder="New password"
                {...form.getInputProps("newPassword")}
                w="100%"
            />
            {passwordError && <Text color="red" size="sm">{passwordError}</Text>}
            <Group w="100%">
                <Button onClick={handleSubmit} fullWidth>
                    Submit
                </Button>
                <Button color="gray" variant="outline" onClick={handlePasswordCancel} fullWidth>
                    Cancel
                </Button>
            </Group>
        </Stack>
    );
}
