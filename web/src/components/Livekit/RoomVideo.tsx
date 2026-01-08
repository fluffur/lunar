import {
    GridLayout,
    ParticipantTile,
    RoomAudioRenderer,
    useTracks,
    useParticipants,
    useRoomContext,
} from "@livekit/components-react";
import { Track, ConnectionState as LiveKitConnectionState } from "livekit-client";
import { CustomControlBar } from "./CustomControlBar.tsx";
import { ConnectionStatus } from "./ConnectionStatus.tsx";
import { ConnectionState } from "./types.ts";
import { Box, Text, Center } from "@mantine/core";
import { useEffect, useState } from "react";

interface RoomVideoProps {
    onFullscreen?: () => void;
}

export function RoomVideo({ onFullscreen }: RoomVideoProps) {
    const room = useRoomContext();
    const participants = useParticipants();
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Connected);

    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    useEffect(() => {
        if (!room) return;

        const updateConnectionState = () => {
            switch (room.state) {
                case LiveKitConnectionState.Connected:
                    setConnectionState(ConnectionState.Connected);
                    break;
                case LiveKitConnectionState.Connecting:
                    setConnectionState(ConnectionState.Connecting);
                    break;
                case LiveKitConnectionState.Reconnecting:
                    setConnectionState(ConnectionState.Reconnecting);
                    break;
                case LiveKitConnectionState.Disconnected:
                    setConnectionState(ConnectionState.Disconnected);
                    break;
                default:
                    setConnectionState(ConnectionState.Disconnected);
            }
        };

        updateConnectionState();
        room.on('connectionStateChanged', updateConnectionState);

        return () => {
            room.off('connectionStateChanged', updateConnectionState);
        };
    }, [room]);

    return (
        <Box>
            <ConnectionStatus
                connectionState={connectionState}
                participantCount={participants.length}
            />

            {tracks.length === 0 ? (
                <Center h="100%" w="100%">
                    <Text c="dimmed" size="sm">
                        No participants yet
                    </Text>
                </Center>
            ) : (
                <GridLayout tracks={tracks} style={{ height: '100%' }}>
                    <ParticipantTile />
                </GridLayout>
            )}

            <RoomAudioRenderer />
            <CustomControlBar onFullscreen={onFullscreen} />
        </Box>
    );
}
