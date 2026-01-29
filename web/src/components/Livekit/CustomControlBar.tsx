import { ActionIcon, Group, Loader, Popover, Stack, Tooltip } from '@mantine/core';
import {
    IconMicrophone,
    IconMicrophoneOff,
    IconVideo,
    IconVideoOff,
    IconScreenShare,
    IconScreenShareOff,
    IconPhoneOff,
    IconMaximize,
    IconChevronDown
} from '@tabler/icons-react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { useState } from 'react';
import { useSoundSettings } from '../../hooks/useSoundSettings.ts';
import { MicrophoneSettingsPanel } from '../MicrophoneSettingsPanel.tsx';

interface CustomControlBarProps {
    onFullscreen?: () => void;
    onDisconnect?: () => void;
}

export function CustomControlBar({ onFullscreen, onDisconnect }: CustomControlBarProps) {
    const { localParticipant } = useLocalParticipant();
    const room = useRoomContext();
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isMicSettingsOpen, setIsMicSettingsOpen] = useState(false);
    const { settings, inputOptions, updateSettings } = useSoundSettings();

    const isMicEnabled = localParticipant?.isMicrophoneEnabled ?? false;
    const isCameraEnabled = localParticipant?.isCameraEnabled ?? false;

    const toggleMicrophone = async () => {
        if (!localParticipant) return;
        await localParticipant.setMicrophoneEnabled(!isMicEnabled);
    };

    const toggleCamera = async () => {
        if (!localParticipant) return;
        await localParticipant.setCameraEnabled(!isCameraEnabled);
    };

    const toggleScreenShare = async () => {
        if (!localParticipant) return;

        try {
            if (isScreenSharing) {
                await localParticipant.setScreenShareEnabled(false);
                setIsScreenSharing(false);
            } else {
                await localParticipant.setScreenShareEnabled(true);
                setIsScreenSharing(true);
            }
        } catch (error) {
            console.error('[LiveKit] Screen share error:', error);
        }
    };

    const handleDisconnect = () => {
        if (onDisconnect) {
            onDisconnect();
        } else {
            room?.disconnect();
        }
    };

    return (
        <Group
            justify="center"
            gap="md"
            style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: 12,
                padding: '12px 20px',
            }}
        >
            <Group
                gap={6}
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: '6px 8px',
                }}
            >
                <Tooltip label={isMicEnabled ? 'Mute' : 'Unmute'}>
                    <ActionIcon
                        size="lg"
                        radius="xl"
                        variant={isMicEnabled ? 'filled' : 'light'}
                        color={isMicEnabled ? 'blue' : 'red'}
                        onClick={toggleMicrophone}
                    >
                        {isMicEnabled ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
                    </ActionIcon>
                </Tooltip>

                <Popover
                    opened={isMicSettingsOpen}
                    onChange={setIsMicSettingsOpen}
                    position="top-start"
                    offset={10}
                    withArrow
                    shadow="md"
                    withinPortal
                >
                    <Popover.Target>
                        <ActionIcon
                            size="sm"
                            radius="xl"
                            variant="light"
                            color="gray"
                            aria-label="Microphone settings"
                            onClick={() => setIsMicSettingsOpen((open) => !open)}
                        >
                            <IconChevronDown
                                size={16}
                                style={{
                                    transform: isMicSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 160ms ease',
                                }}
                            />
                        </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown>
                        {settings ? (
                            <Stack gap="sm" w={240}>
                                <MicrophoneSettingsPanel
                                    inputOptions={inputOptions}
                                    inputDeviceId={settings.inputDeviceId}
                                    micLevel={settings.micLevel}
                                    onInputDeviceChange={(value) =>
                                        updateSettings({ inputDeviceId: value })
                                    }
                                    onMicLevelChange={(value) => updateSettings({ micLevel: value })}
                                />
                            </Stack>
                        ) : (
                            <Loader size="sm" />
                        )}
                    </Popover.Dropdown>
                </Popover>
            </Group>

            <Tooltip label={isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}>
                <ActionIcon
                    size="lg"
                    radius="xl"
                    variant={isCameraEnabled ? 'filled' : 'light'}
                    color={isCameraEnabled ? 'blue' : 'red'}
                    onClick={toggleCamera}
                >
                    {isCameraEnabled ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
                </ActionIcon>
            </Tooltip>

            <Tooltip label={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
                <ActionIcon
                    size="lg"
                    radius="xl"
                    variant={isScreenSharing ? 'filled' : 'light'}
                    color={isScreenSharing ? 'green' : 'gray'}
                    onClick={toggleScreenShare}
                >
                    {isScreenSharing ? <IconScreenShareOff size={20} /> : <IconScreenShare size={20} />}
                </ActionIcon>
            </Tooltip>

            {onFullscreen && (
                <Tooltip label="Fullscreen">
                    <ActionIcon
                        size="lg"
                        radius="xl"
                        variant="light"
                        color="gray"
                        onClick={onFullscreen}
                    >
                        <IconMaximize size={20} />
                    </ActionIcon>
                </Tooltip>
            )}

            <Tooltip label="Disconnect">
                <ActionIcon
                    size="lg"
                    radius="xl"
                    variant="filled"
                    color="red"
                    onClick={handleDisconnect}
                >
                    <IconPhoneOff size={20} />
                </ActionIcon>
            </Tooltip>
        </Group>
    );
}
