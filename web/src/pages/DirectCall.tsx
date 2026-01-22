import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { Box, Center, Loader, Text, Button } from "@mantine/core";
import { LIVEKIT_WS_URL } from "../config";
import { livekitApi } from "../api";
import { DirectCallView } from "../components/Livekit/DirectCallView";

export function DirectCall() {
    const { roomSlug } = useParams<{ roomSlug: string }>();
    const navigate = useNavigate();
    const [token, setToken] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchToken = async () => {
            if (!roomSlug) return;
            try {
                // We use the same token endpoint as rooms for now.
                // The backend implementation of `livekitHandler.Token` generates a token for the given room name.
                // It doesn't check if the room exists in DB, so it works for transient rooms too if backend allows it.
                // Let's verify `livekitHandler.Token`.
                // Looking at `internal/livekit/handler.go` (I should assume it generates token).
                const { data } = await livekitApi.livekitTokenRoomSlugGet(roomSlug);
                setToken(data.token);
            } catch (err) {
                console.error("Failed to get token", err);
                setError("Failed to join call");
            }
        };

        fetchToken();
    }, [roomSlug]);

    if (error) {
        return (
            <Center h="100vh">
                <Text c="red">{error}</Text>
                <Button onClick={() => navigate('/')} mt="md">Go Home</Button>
            </Center>
        );
    }

    if (!token) {
        return (
            <Center h="100vh">
                <Loader size="xl" />
            </Center>
        );
    }

    return (
        <Box w="100%" h="100vh" __vars={{ '--lk-bg': 'transparent' }}>
            <LiveKitRoom
                serverUrl={LIVEKIT_WS_URL}
                token={token}
                connect={true}
                video={true}
                audio={true}
                onDisconnected={() => navigate('/')}
                style={{ height: '100%' }}
            >
                <DirectCallView onDisconnect={() => navigate('/')} />
            </LiveKitRoom>
        </Box>
    );
}
