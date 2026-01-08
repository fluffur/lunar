import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import * as React from "react";
import { useLiveKitConnection } from "../../hooks/useLiveKitConnection.ts";
import { LIVEKIT_WS_URL } from "../../config.ts";
import { ConnectionState } from "./types.ts";
import { Text, Button, Stack, Loader, Center } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

type Props = {
    roomSlug: string;
    children: React.ReactNode;
};

export function LiveKitRoomWrapper({ roomSlug, children }: Props) {
    const { token, connectionState, error, retry } = useLiveKitConnection(roomSlug);

    if (connectionState === ConnectionState.Connecting || connectionState === ConnectionState.Reconnecting) {
        return (
            <Center h="100%" w="100%">
                <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text size="sm" c="dimmed">
                        {connectionState === ConnectionState.Reconnecting ? 'Reconnecting...' : 'Connecting to call...'}
                    </Text>
                </Stack>
            </Center>
        );
    }

    if (connectionState === ConnectionState.Error || error) {
        return (
            <Center h="100%" w="100%">
                <Stack align="center" gap="md" maw={400}>
                    <IconAlertCircle size={48} color="red" />
                    <Text size="lg" fw={600}>Connection Error</Text>
                    <Text size="sm" c="dimmed" ta="center">
                        {error?.message || 'Failed to connect to the call'}
                    </Text>
                    <Button onClick={retry} variant="filled">
                        Retry Connection
                    </Button>
                </Stack>
            </Center>
        );
    }

    if (!token) {
        return (
            <Center h="100%" w="100%">
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <LiveKitRoom
            token={token}
            serverUrl={LIVEKIT_WS_URL}
            connect
            video
            audio
            data-lk-theme="default"
            onDisconnected={(reason) => {
                console.log('[LiveKit] Disconnected:', reason);
            }}
            onError={(error) => {
                console.error('[LiveKit] Room error:', error);
            }}
        >
            {children}
        </LiveKitRoom>
    );
}
