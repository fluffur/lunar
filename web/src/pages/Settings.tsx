import {Button, Center, Divider, Group, Paper, Stack, Title} from "@mantine/core";
import {useEffect, useState} from "react";
import type {ReactNode} from "react";
import {SoundSettingsSection} from "../components/SoundSettingsSection.tsx";
import {ProfileSection} from "../components/ProfileSection.tsx";
import {AvatarSettingsSection} from "../components/AvatarSettingsSection.tsx";
import {useNavigate, useParams} from "react-router-dom";

type SettingsSectionId = "profile" | "sound" | "avatar";

type SettingsSectionConfig = {
    id: SettingsSectionId;
    label: string;
    render: () => ReactNode;
};

const SETTINGS_SECTIONS: Record<SettingsSectionId, SettingsSectionConfig> = {
    profile: {
        id: "profile",
        label: "Profile",
        render: () => <ProfileSection />,
    },
    sound: {
        id: "sound",
        label: "Sound",
        render: () => <SoundSettingsSection />,
    },
    avatar: {
        id: "avatar",
        label: "Avatar",
        render: () => <AvatarSettingsSection />,
    },
};

const isSettingsSectionId = (value: string | undefined): value is SettingsSectionId =>
    value === "profile" || value === "sound" || value === "avatar";

export default function Settings() {
    const {sectionId} = useParams();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<SettingsSectionId>("profile");

    useEffect(() => {
        if (isSettingsSectionId(sectionId)) {
            setActiveSection(sectionId);
        } else {
            navigate("/settings/profile", {replace: true});
        }        
    }, [navigate, sectionId]);

    return (
        <Group
            align="flex-start"
            gap="xl"
            wrap="nowrap"
            p="md"
            style={{height: "calc(100vh - 60px)"}}
        >
            <Stack w={200} gap="sm">
                <Title order={3}>Settings</Title>
                {Object.values(SETTINGS_SECTIONS).map((section) => (
                    <Button
                        key={section.id}
                        variant={activeSection === section.id ? "filled" : "subtle"}
                        onClick={() => {
                            navigate(`/settings/${section.id}`);
                        }}
                        justify="flex-start"
                        styles={{root: {borderWidth: 0}}}
                    >
                        {section.label}
                    </Button>
                ))}
            </Stack>

            <Divider orientation="vertical"/>

            <Center style={{flex: 1}}>
                <Paper p="md" radius="lg" w="100%" maw={700}>
                    {SETTINGS_SECTIONS[activeSection].render()}
                </Paper>
            </Center>
        </Group>
    );
}
