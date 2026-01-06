import {ActionIcon, Group, Modal, Stack, TextInput,} from "@mantine/core";
import {IconCheck, IconEdit, IconX} from "@tabler/icons-react";
import {useState} from "react";
import {userApi} from "../api.ts";
import {useSessionStore} from "../stores/sessionStore.ts";
import VerifyEmailForm from "./VerifyEmailForm.tsx";
import axios from "axios";

export default function EmailSection() {
    const {user, setUser} = useSessionStore();
    const [email, setEmail] = useState(user?.email || "");
    const [originalEmail, setOriginalEmail] = useState(email);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [verificationModalOpen, setVerificationModalOpen] = useState(false);
    const [error, setError] = useState("")

    const handleEmailSave = async () => {
        if (email === originalEmail) return setIsEditingEmail(false);

        try {
            await userApi.usersMeEmailPut({email});
            setVerificationModalOpen(true);
            setIsEditingEmail(false);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error?.fields?.email ?? "")
                return
            }
            console.error(err);
        }
    };

    const handleEmailCancel = () => {
        setEmail(originalEmail);
        setIsEditingEmail(false);
    };

    const handleVerifySuccess = () => {
        setUser({...user!, email});
        setOriginalEmail(email);
        setVerificationModalOpen(false);
    };

    return (
        <Stack w="100%">
            <TextInput
                label="Email"
                error={error}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                disabled={!isEditingEmail}
                w="100%"
                rightSection={
                    isEditingEmail ? (
                        <Group display="flex" wrap="nowrap" gap={4} align="center">
                            <ActionIcon color="green" onClick={handleEmailSave}>
                                <IconCheck size={18}/>
                            </ActionIcon>
                            <ActionIcon color="red" onClick={handleEmailCancel}>
                                <IconX size={18}/>
                            </ActionIcon>
                        </Group>
                    ) : (
                        <ActionIcon onClick={() => setIsEditingEmail(true)}>
                            <IconEdit size={18}/>
                        </ActionIcon>
                    )
                }
                rightSectionWidth={isEditingEmail ? 65 : 40}
            />

            <Modal
                opened={verificationModalOpen}
                onClose={() => setVerificationModalOpen(false)}
                title="Verify New Email"
                centered
            >
                <VerifyEmailForm
                    initialEmail={email}
                    onSuccess={handleVerifySuccess}
                    fixedEmail={true}
                />
            </Modal>
        </Stack>
    );
}
