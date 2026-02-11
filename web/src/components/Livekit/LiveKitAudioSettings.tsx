import {RoomAudioRenderer, useLocalParticipant, useRoomContext} from "@livekit/components-react";
import {useEffect, useMemo} from "react";
import {LocalAudioTrack} from "livekit-client";
import {useSoundSettings} from "../../hooks/useSoundSettings.ts";
import {createGainProcessor, type GainProcessor} from "./AudioGainProcessor.ts";

const getMicLevelGain = (settings: { micLevel: number } | null) => {
    if (!settings) return 1;
    const clamped = Math.max(0, Math.min(100, settings.micLevel));
    return clamped / 100;
};

export function LiveKitAudioSettings() {
    const room = useRoomContext();
    const {settings} = useSoundSettings();
    const {microphoneTrack} = useLocalParticipant();
    const gainProcessor = useMemo<GainProcessor>(() => createGainProcessor(1), []);

    useEffect(() => {
        if (!room || !settings) return;

        if (settings.inputDeviceId) {
            room.switchActiveDevice("audioinput", settings.inputDeviceId).catch((err) => {
                console.warn("[LiveKit] Failed to switch audio input device", err);
            });
        }
    }, [room, settings?.inputDeviceId]);

    useEffect(() => {
        if (!room || !settings || !settings.outputDeviceId) return;

        room.switchActiveDevice("audiooutput", settings.outputDeviceId).catch((err) => {
            console.warn("[LiveKit] Failed to switch audio output device", err);
        });
    }, [room, settings?.outputDeviceId]);

    useEffect(() => {
        gainProcessor.setGain(getMicLevelGain(settings));
    }, [settings?.micLevel, gainProcessor]);

    useEffect(() => {
        const track = microphoneTrack?.track;
        if (!track || !(track instanceof LocalAudioTrack)) return;
        track.setProcessor(gainProcessor).catch((err) => {
            console.warn("[LiveKit] Failed to apply mic gain processor", err);
        });
    }, [microphoneTrack?.track, gainProcessor]);

    useEffect(() => {
        return () => {
            gainProcessor.destroy().catch(() => undefined);
        };
    }, [gainProcessor]);

    const volume = useMemo(() => {
        if (!settings) return 1;
        const clamped = Math.max(0, Math.min(100, settings.soundLevel));
        return clamped / 100;
    }, [settings]);

    return (
        <RoomAudioRenderer
            volume={volume}
            muted={volume === 0}
        />
    );
}
