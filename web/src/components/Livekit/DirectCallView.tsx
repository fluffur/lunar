import {
    RoomAudioRenderer,
    useParticipants,
    useLocalParticipant,
    useIsSpeaking,
    VideoTrack,
    useTracks,
} from "@livekit/components-react";
import { Track, Participant } from "livekit-client";
import { CustomControlBar } from "./CustomControlBar.tsx";
import { Box, Text, Stack, Group, Center } from "@mantine/core";
import { IconMicrophoneOff } from "@tabler/icons-react";
import { useEffect, useMemo } from "react";
import { UserAvatar } from "../UserAvatar.tsx";
import { useSessionStore } from "../../stores/sessionStore.ts";

interface ParticipantAvatarProps {
    participant: Participant;
    size?: number;
    showVideo?: boolean;
}

function ParticipantAvatar({ participant, size = 120, showVideo = true }: ParticipantAvatarProps) {
    const isSpeaking = useIsSpeaking(participant);
    const isMuted = !participant.isMicrophoneEnabled;
    const isCameraOn = participant.isCameraEnabled;
    const currentUser = useSessionStore((state) => state.user);

    const tracks = useTracks(
        [{ source: Track.Source.Camera, withPlaceholder: false }],
        { onlySubscribed: false }
    ).filter(track => track.participant.identity === participant.identity);

    const cameraTrack = tracks.find(t => t.source === Track.Source.Camera);
    const hasValidTrack = cameraTrack && 'publication' in cameraTrack && cameraTrack.publication;

    const displayName = participant.name || participant.identity || 'Unknown';
    const isCurrentUser = currentUser && participant.identity === currentUser.id;
    let avatarUrl: string | null = null;
    if (isCurrentUser) {
        avatarUrl = currentUser.avatarUrl || null;
    } else {
        try {
            const metadata = participant.metadata ? JSON.parse(participant.metadata) : null;
            if (metadata && metadata.avatarUrl) {
                avatarUrl = metadata.avatarUrl;
            }
        } catch (e) {
            console.warn("Failed to parse participant metadata:", e);
        }
    }

    return (
        <Stack align="center" gap="md">
            <Box
                style={{
                    position: 'relative',
                    borderRadius: '50%',
                    padding: 4,
                    background: isSpeaking
                        ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        : 'transparent',
                    transition: 'all 0.3s ease',
                    animation: isSpeaking ? 'pulse-speaking 1.5s infinite' : 'none',
                }}
            >
                <Box
                    style={{
                        width: size,
                        height: size,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: isSpeaking
                            ? '3px solid #22c55e'
                            : '3px solid var(--mantine-color-dark-4)',
                        transition: 'border-color 0.3s ease',
                        position: 'relative',
                        background: 'var(--mantine-color-dark-6)',
                    }}
                >
                    {showVideo && isCameraOn && hasValidTrack && cameraTrack ? (
                        <VideoTrack
                            trackRef={cameraTrack as any}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <Center h="100%" w="100%">
                            <UserAvatar
                                username={displayName}
                                avatarUrl={avatarUrl}
                                size={size - 10}
                                radius="50%"
                            />
                        </Center>
                    )}
                </Box>

                {/* Muted indicator */}
                {isMuted && (
                    <Box
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            background: 'var(--mantine-color-red-6)',
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid var(--mantine-color-dark-7)',
                        }}
                    >
                        <IconMicrophoneOff size={16} color="white" />
                    </Box>
                )}
            </Box>

            <Stack gap={4} align="center">
                <Text
                    size="lg"
                    fw={600}
                    style={{
                        color: isSpeaking ? '#22c579' : 'var(--mantine-color-text)',
                        transition: 'color 0.3s ease',
                    }}
                >
                    {displayName}
                </Text>
            </Stack>
        </Stack>
    );
}

interface DirectCallViewProps {
    onDisconnect?: () => void;
}

export function DirectCallView({ onDisconnect }: DirectCallViewProps) {
    const participants = useParticipants();
    const { localParticipant } = useLocalParticipant();
    const screenShareTracks = useTracks([{ source: Track.Source.ScreenShare, withPlaceholder: false }]);

    const activeScreenShare = screenShareTracks.length > 0 ? screenShareTracks[0] : null;

    useEffect(() => {
        const styleId = 'direct-call-pulse-animation';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            @keyframes pulse-speaking {
                0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
                100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
            }
        `;
        document.head.appendChild(style);

        return () => {
            const existingStyle = document.getElementById(styleId);
            if (existingStyle) {
                document.head.removeChild(existingStyle);
            }
        };
    }, []);

    const allParticipants = useMemo(() => {
        const all = [];
        if (localParticipant) {
            all.push(localParticipant);
        }
        const remoteParticipants = participants.filter(
            p => p.identity !== localParticipant?.identity
        );
        all.push(...remoteParticipants);
        return all;
    }, [participants, localParticipant]);

    return (
        <Box
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'linear-gradient(180deg, var(--mantine-color-dark-8) 0%, var(--mantine-color-dark-9) 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {activeScreenShare ? (
                    <Box style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <Box style={{ flex: 1, minHeight: 0 }}>
                            <VideoTrack
                                trackRef={activeScreenShare as any}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </Box>

                        {/* Overlay for participants when screen sharing */}
                        <Box
                            style={{
                                position: 'absolute',
                                bottom: 100,
                                left: 0,
                                right: 0,
                                zIndex: 5,
                                pointerEvents: 'none'
                            }}
                        >
                            <Group justify="center" gap="xl" style={{ pointerEvents: 'auto' }}>
                                {allParticipants.map((participant) => (
                                    <ParticipantAvatar
                                        key={participant.identity}
                                        participant={participant}
                                        size={activeScreenShare ? 100 : 180}
                                    />
                                ))}
                            </Group>
                        </Box>
                    </Box>
                ) : (
                    allParticipants.length === 0 ? (
                        <Stack align="center" gap="xl">
                            <Text c="dimmed" size="lg">
                                Waiting for others to join...
                            </Text>
                        </Stack>
                    ) : (
                        <Group gap={60} justify="center" wrap="nowrap">
                            {allParticipants.map((participant) => (
                                <ParticipantAvatar
                                    key={participant.identity}
                                    participant={participant}
                                    size={180}
                                />
                            ))}
                        </Group>
                    )
                )}
            </Box>

            <RoomAudioRenderer />
            <CustomControlBar onDisconnect={onDisconnect} />
        </Box>
    );
}
