import {Track, type AudioProcessorOptions, type TrackProcessor} from "livekit-client";

export type GainProcessor = TrackProcessor<Track.Kind.Audio, AudioProcessorOptions> & {
    setGain: (value: number) => void;
};

export function createGainProcessor(initialGain = 1): GainProcessor {
    let source: MediaStreamAudioSourceNode | undefined;
    let gainNode: GainNode | undefined;
    let destination: MediaStreamAudioDestinationNode | undefined;
    let audioContext: AudioContext | undefined;
    let gain = initialGain;

    const setGain = (value: number) => {
        gain = value;
        if (gainNode) {
            gainNode.gain.value = value;
        }
    };

    const cleanup = async () => {
        if (source) source.disconnect();
        if (gainNode) gainNode.disconnect();
        if (destination) destination.disconnect();
        if (audioContext) audioContext.close();
        audioContext = undefined;
        source = undefined;
        gainNode = undefined;
        destination = undefined;
    };

    const setup = async (opts: AudioProcessorOptions) => {
        await cleanup();
        const audioContext = opts.audioContext ?? new AudioContext();
        source = audioContext.createMediaStreamSource(new MediaStream([opts.track]));
        gainNode = audioContext.createGain();
        gainNode.gain.value = gain;
        destination = audioContext.createMediaStreamDestination();
        source.connect(gainNode).connect(destination);
        processor.processedTrack = destination.stream.getAudioTracks()[0];
    };

    const processor: GainProcessor = {
        name: "gain-processor",
        init: setup,
        restart: setup,
        destroy: cleanup,
        setGain,
    };

    return processor;
}
