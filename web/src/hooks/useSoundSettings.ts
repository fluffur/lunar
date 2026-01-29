import {useCallback, useEffect, useMemo, useState} from "react";
import {listAudioDevices, type AudioDevice} from "../repositories/mediaDevicesRepository.ts";
import {
    loadSoundSettings,
    saveSoundSettings,
    type SoundSettings
} from "../repositories/soundSettingsRepository.ts";

export function useSoundSettings() {
    const [inputs, setInputs] = useState<AudioDevice[]>([]);
    const [outputs, setOutputs] = useState<AudioDevice[]>([]);
    const [settings, setSettings] = useState<SoundSettings | null>(null);

    useEffect(() => {
        (async () => {
            const {inputs, outputs} = await listAudioDevices();
            setInputs(inputs);
            setOutputs(outputs);
            setSettings(loadSoundSettings());
        })();
    }, []);

    const inputOptions = useMemo(
        () => inputs.map((d) => ({value: d.id, label: d.label})),
        [inputs]
    );

    const outputOptions = useMemo(
        () => outputs.map((d) => ({value: d.id, label: d.label})),
        [outputs]
    );

    const updateSettings = useCallback((partial: Partial<SoundSettings>) => {
        setSettings((current) => {
            const next = {...(current ?? loadSoundSettings()), ...partial};
            saveSoundSettings(next);
            return next;
        });
    }, []);

    return {
        inputs,
        outputs,
        inputOptions,
        outputOptions,
        settings,
        updateSettings,
    };
}
