import {Loader, Paper, Stack, Title} from "@mantine/core";
import {useSoundSettings} from "../hooks/useSoundSettings.ts";
import {MicrophoneSettingsPanel} from "./MicrophoneSettingsPanel.tsx";
import {OutputSoundSettingsPanel} from "./OutputSoundSettingsPanel.tsx";

export function SoundSettingsSection() {
    const {settings, inputOptions, outputOptions, updateSettings} = useSoundSettings();

    if (settings == null) {
        return <Loader />;
    }

    return (
        <Stack gap="lg" w="100%">
            <Title order={3}>Sound settings</Title>

            <Paper withBorder p="md" radius="md">
                <MicrophoneSettingsPanel
                    inputOptions={inputOptions}
                    inputDeviceId={settings.inputDeviceId}
                    micLevel={settings.micLevel}
                    onInputDeviceChange={(value) => updateSettings({inputDeviceId: value})}
                    onMicLevelChange={(value) => updateSettings({micLevel: value})}
                />
            </Paper>

            <Paper withBorder p="md" radius="md">
                <OutputSoundSettingsPanel
                    outputOptions={outputOptions}
                    outputDeviceId={settings.outputDeviceId}
                    soundLevel={settings.soundLevel}
                    onOutputDeviceChange={(value) => updateSettings({outputDeviceId: value})}
                    onSoundLevelChange={(value) => updateSettings({soundLevel: value})}
                />
            </Paper>
        </Stack>
    );
}
