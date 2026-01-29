export type SoundSettings = {
    inputDeviceId: string | null;
    outputDeviceId: string | null;
    micLevel: number;
    soundLevel: number;
};

const STORAGE_KEY = "sound_settings";

const DEFAULT_SETTINGS: SoundSettings = {
    inputDeviceId: null,
    outputDeviceId: null,
    micLevel: 100,
    soundLevel: 100,
};

export function loadSoundSettings(): SoundSettings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save sound settings", e);
    }
}

