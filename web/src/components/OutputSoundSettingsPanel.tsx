import {Select, Slider, Stack, Text, Title} from "@mantine/core";

type Option = {
    value: string;
    label: string;
};

interface OutputSoundSettingsPanelProps {
    outputOptions: Option[];
    outputDeviceId: string | null;
    soundLevel: number;
    onOutputDeviceChange: (value: string | null) => void;
    onSoundLevelChange: (value: number) => void;
    title?: string;
    showTitle?: boolean;
}

export function OutputSoundSettingsPanel({
    outputOptions,
    outputDeviceId,
    soundLevel,
    onOutputDeviceChange,
    onSoundLevelChange,
    title = "Output settings",
    showTitle = false,
}: OutputSoundSettingsPanelProps) {
    return (
        <Stack gap="md">
            {showTitle && <Title order={4}>{title}</Title>}

            <Stack gap={4}>
                <Text size="sm" fw={500}>
                    Output device
                </Text>
                <Select
                    data={outputOptions}
                    value={outputDeviceId}
                    onChange={onOutputDeviceChange}
                    placeholder="Select device"
                    nothingFoundMessage="No devices found"
                />
            </Stack>

            <Stack gap={4} mt="xs">
                <Text size="sm" fw={500}>
                    Volume
                </Text>
                <Slider value={soundLevel} onChange={onSoundLevelChange} />
            </Stack>
        </Stack>
    );
}
