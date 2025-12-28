import {ActionIcon, Collapse, Group, Stack, Text, TextInput,} from "@mantine/core";
import {IconCheck, IconEdit, IconX} from "@tabler/icons-react";
import {useState} from "react";
import {userApi} from "../api.ts";
import {useSessionStore} from "../stores/sessionStore.ts";

export default function EmailSection() {
    const {user, setUser} = useSessionStore();
    const [email, setEmail] = useState(user?.email || "");
    const [originalEmail, setOriginalEmail] = useState(email);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [emailSaved, setEmailSaved] = useState(false);

    const handleEmailSave = async () => {
        if (email === originalEmail) return setIsEditingEmail(false);

        try {
            await userApi.usersMeEmailPut({email});
            if (user) {
                setUser({...user, email, emailVerified: false});
            }
            setOriginalEmail(email);
            setEmailSaved(true);
            setIsEditingEmail(false);
            setTimeout(() => setEmailSaved(false), 3000);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEmailCancel = () => {
        setEmail(originalEmail);
        setIsEditingEmail(false);
    };

    return (
        <Stack w="100%">
            <TextInput
                label="Email"
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

            <Collapse in={emailSaved}>
                <Text color="green" size="sm">
                    Email updated. Please verify new email.
                </Text>
            </Collapse>
        </Stack>
    );
}
