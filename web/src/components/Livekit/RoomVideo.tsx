import {
    ControlBar,
    GridLayout,
    ParticipantTile, RoomAudioRenderer,
    useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";

export function RoomVideo() {
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: false }
    );

    return (
        <>
            <GridLayout tracks={tracks}>
                <ParticipantTile/>
            </GridLayout>
            <RoomAudioRenderer />
            <ControlBar />
        </>
    );
}
