import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {listAudioDevices, type AudioDevice} from "../repositories/mediaDevicesRepository.ts";
import {
    loadSoundSettings,
    saveSoundSettings,
    SOUND_SETTINGS_CHANGED_EVENT,
    SOUND_SETTINGS_STORAGE_KEY,
    type SoundSettings
} from "../repositories/soundSettingsRepository.ts";

export function useSoundSettings() {
    const [inputs, setInputs] = useState<AudioDevice[]>([]);
    const [outputs, setOutputs] = useState<AudioDevice[]>([]);
    const [settings, setSettings] = useState<SoundSettings | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const pendingSettingsRef = useRef<SoundSettings | null>(null);

    useEffect(() => {
        (async () => {
            const {inputs, outputs} = await listAudioDevices();
            setInputs(inputs);
            setOutputs(outputs);
            const nextSettings = loadSoundSettings();
            const nextInputId = nextSettings.inputDeviceId ?? inputs[0]?.id ?? null;
            const nextOutputId = nextSettings.outputDeviceId ?? outputs[0]?.id ?? null;
            const mergedSettings = {
                ...nextSettings,
                inputDeviceId: nextInputId,
                outputDeviceId: nextOutputId,
            };
            if (
                mergedSettings.inputDeviceId !== nextSettings.inputDeviceId ||
                mergedSettings.outputDeviceId !== nextSettings.outputDeviceId
            ) {
                saveSoundSettings(mergedSettings);
            }
            setSettings(mergedSettings);
        })();
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleCustomChange = (event: Event) => {
            const customEvent = event as CustomEvent<SoundSettings>;
            if (!customEvent.detail) return;
            setSettings(customEvent.detail);
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key !== SOUND_SETTINGS_STORAGE_KEY) return;
            setSettings(loadSoundSettings());
        };

        window.addEventListener(SOUND_SETTINGS_CHANGED_EVENT, handleCustomChange);
        window.addEventListener("storage", handleStorage);
        return () => {
            window.removeEventListener(SOUND_SETTINGS_CHANGED_EVENT, handleCustomChange);
            window.removeEventListener("storage", handleStorage);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current != null) {
                window.clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = null;
            }
            pendingSettingsRef.current = null;
        };
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
            pendingSettingsRef.current = next;
            if (typeof window !== "undefined") {
                if (saveTimeoutRef.current != null) {
                    window.clearTimeout(saveTimeoutRef.current);
                }
                saveTimeoutRef.current = window.setTimeout(() => {
                    if (pendingSettingsRef.current) {
                        saveSoundSettings(pendingSettingsRef.current);
                    }
                    pendingSettingsRef.current = null;
                    saveTimeoutRef.current = null;
                }, 150);
            }
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
