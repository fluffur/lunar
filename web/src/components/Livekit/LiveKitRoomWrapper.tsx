import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { useEffect, useState } from "react";
import {livekitApi} from "../../api.ts";
import * as React from "react";

type Props = {
    roomSlug: string;
    children: React.ReactNode;
};

export function LiveKitRoomWrapper({ roomSlug, children }: Props) {
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        livekitApi.livekitTokenRoomSlugGet(roomSlug)
            .then((r) => r.data.token)
            .then(setToken)
    }, [roomSlug]);

    if (!token) return null;

    return (
        <LiveKitRoom
            token={token}
            serverUrl="ws://localhost:7880"
            connect
            video
            audio
            data-lk-theme="default"
        >
            {children}
        </LiveKitRoom>
    );
}
