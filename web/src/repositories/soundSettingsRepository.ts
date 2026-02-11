export type SoundSettings = {
    inputDeviceId: string | null;
    outputDeviceId: string | null;
    micLevel: number;
    soundLevel: number;
};

export const SOUND_SETTINGS_STORAGE_KEY = "sound_settings";
export const SOUND_SETTINGS_CHANGED_EVENT = "sound_settings_changed";

const DEFAULT_SETTINGS: SoundSettings = {
    inputDeviceId: null,
    outputDeviceId: null,
    micLevel: 100,
    soundLevel: 100,
};

export function loadSoundSettings(): SoundSettings {
    try {
        const raw = localStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;

        const parsed = JSON.parse(raw) as Partial<SoundSettings>;
        return {
            ...DEFAULT_SETTINGS,
            ...parsed,
        };
    } catch (e) {
        console.error("Failed to load sound settings", e);
        return DEFAULT_SETTINGS;
    }
}

export function saveSoundSettings(settings: SoundSettings) {
    try {
        localStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        console.info("[SoundSettings] Updated", settings);
        if (typeof window !== "undefined") {
            const dispatch = () =>
                window.dispatchEvent(
                    new CustomEvent(SOUND_SETTINGS_CHANGED_EVENT, { detail: settings })
                );
            if (typeof queueMicrotask === "function") {
                queueMicrotask(dispatch);
            } else {
                setTimeout(dispatch, 0);
            }
        }
    } catch (e) {
        console.error("Failed to save sound settings", e);
    }
}
