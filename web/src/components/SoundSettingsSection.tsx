import {Loader, Paper, Select, Slider, Stack, Text, Title} from "@mantine/core";
import {useEffect, useMemo, useState} from "react";
import {listAudioDevices, type AudioDevice} from "../repositories/mediaDevicesRepository.ts";
import {
    loadSoundSettings,
    saveSoundSettings,
    type SoundSettings
} from "../repositories/soundSettingsRepository.ts";

export function SoundSettingsSection() {
    const [inputs, setInputs] = useState<AudioDevice[]>([]);
    const [outputs, setOutputs] = useState<AudioDevice[]>([]);
    const [settings, setSettings] = useState<SoundSettings>();

    useEffect(() => {
        (async () => {
            const {inputs, outputs} = await listAudioDevices();
            setInputs(inputs);
            setOutputs(outputs);
            setSettings(await loadSoundSettings())
        })();
    }, []);

    const inputOptions = useMemo(
        () => inputs.map((d) => ({value: d.id, label: d.label})),
        [inputs]
    );

    const outputOptions = useMemo(
        () => outputs.map((d) => ({value: d.id, label: d.label})),
        [outputs]
    );

    if (settings == null) {
        return <Loader />;
    }

    const updateSettings = (partial: Partial<SoundSettings>) => {
        const next = {...settings, ...partial};
        saveSoundSettings(next);
        setSettings(next);
    };

    return (
        <Stack gap="lg" w="100%">
            <Title order={3}>Sound settings</Title>

            <Paper withBorder p="md" radius="md">
                <Stack gap="md">
                    <Stack gap={4}>
                        <Text size="sm" fw={500}>
                            Input device
                        </Text>
                        <Select
                            data={inputOptions}
                            value={settings.inputDeviceId}
                            onChange={(value) => updateSettings({inputDeviceId: value})}
                            placeholder="Select device"
                            nothingFoundMessage="No devices found"
                        />
                    </Stack>

                    <Stack gap={4} mt="xs">
                        <Text size="sm" fw={500}>
                            Volume
                        </Text>
                        <Slider
                            value={settings.micLevel}
                            onChange={(value) => updateSettings({micLevel: value})}
                        />
                    </Stack>
                </Stack>
            </Paper>

            <Paper withBorder p="md" radius="md">
                <Stack gap="md">
                    <Stack gap={4}>
                        <Text size="sm" fw={500}>
                            Output device
                        </Text>
                        <Select
                            data={outputOptions}
                            value={settings.outputDeviceId}
                            onChange={(value) => updateSettings({outputDeviceId: value})}
                            placeholder="Select device"
                            nothingFoundMessage="No devices found"
                        />
                    </Stack>

                    <Stack gap={4} mt="xs">
                        <Text size="sm" fw={500}>
                            Volume
                        </Text>
                        <Slider
                            value={settings.soundLevel}
                            onChange={(value) => updateSettings({soundLevel: value})}
                        />
                    </Stack>
                </Stack>
            </Paper>
        </Stack>
    );
}

