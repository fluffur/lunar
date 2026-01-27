export type AudioDevice = {
    id: string;
    label: string;
    kind: "input" | "output";
};

const virtualPatterns = ["virtual", "vb-audio", "cable", "voicemeeter"];

const isRealDevice = (device: MediaDeviceInfo) => {
    const label = device.label.toLowerCase();
    const isDefault =
        device.deviceId === "default" || label.includes("default");

    if (isDefault) return false;

    return !virtualPatterns.some((pattern) => label.includes(pattern));
};

export async function listAudioDevices(): Promise<{
    inputs: AudioDevice[];
    outputs: AudioDevice[];
}> {
    const allDevices = await navigator.mediaDevices.enumerateDevices();

    if (typeof navigator === "undefined" || !allDevices) {
        return {inputs: [], outputs: []};
    }

    try {
        const inputs: AudioDevice[] = [];
        const outputs: AudioDevice[] = [];

        allDevices.forEach((device, index) => {
            if (!isRealDevice(device)) return;

            if (device.kind === "audioinput") {
                inputs.push({
                    id: device.deviceId || `input-${index}`,
                    label: device.label || `Microphone ${inputs.length + 1}`,
                    kind: "input",
                });
            }

            if (device.kind === "audiooutput") {
                outputs.push({
                    id: device.deviceId || `output-${index}`,
                    label: device.label || `Output device ${outputs.length + 1}`,
                    kind: "output",
                });
            }
        });

        return {inputs, outputs};
    } catch (e) {
        console.error("Failed to enumerate media devices", e);
        return {inputs: [], outputs: []};
    }
}

