import {Select, Slider, Stack, Text, Title} from "@mantine/core";

type Option = {
    value: string;
    label: string;
};

interface MicrophoneSettingsPanelProps {
    inputOptions: Option[];
    inputDeviceId: string | null;
    micLevel: number;
    onInputDeviceChange: (value: string | null) => void;
    onMicLevelChange: (value: number) => void;
    title?: string;
    showTitle?: boolean;
}

export function MicrophoneSettingsPanel({
    inputOptions,
    inputDeviceId,
    micLevel,
    onInputDeviceChange,
    onMicLevelChange,
    title = "Microphone settings",
    showTitle = false,
}: MicrophoneSettingsPanelProps) {
    return (
        <Stack gap="md">
            {showTitle && <Title order={4}>{title}</Title>}

            <Stack gap={4}>
                <Text size="sm" fw={500}>
                    Input device
                </Text>
                <Select
                    data={inputOptions}
                    value={inputDeviceId}
                    onChange={onInputDeviceChange}
                    placeholder="Select device"
                    nothingFoundMessage="No devices found"
                />
            </Stack>

            <Stack gap={4} mt="xs">
                <Text size="sm" fw={500}>
                    Volume
                </Text>
                <Slider value={micLevel} onChange={onMicLevelChange} />
            </Stack>
        </Stack>
    );
}
