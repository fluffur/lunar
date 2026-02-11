import { useParams, useNavigate } from "react-router-dom";
import { Box, Center, Text, Button } from "@mantine/core";
import { DirectCallView } from "../components/Livekit/DirectCallView";
import { LiveKitRoomWrapper } from "../components/Livekit/LiveKitRoomWrapper.tsx";

export function DirectCall() {
    const { roomSlug } = useParams<{ roomSlug: string }>();
    const navigate = useNavigate();
    if (!roomSlug) {
        return (
            <Center h="100vh">
                <Text c="red">Invalid call link</Text>
                <Button onClick={() => navigate('/')} mt="md">Go Home</Button>
            </Center>
        );
    }

    return (
        <Box w="100%" h="100vh" __vars={{ '--lk-bg': 'transparent' }}>
            <LiveKitRoomWrapper roomSlug={roomSlug} onDisconnected={() => navigate('/')}>
                <DirectCallView onDisconnect={() => navigate('/')} />
            </LiveKitRoomWrapper>
        </Box>
    );
}
