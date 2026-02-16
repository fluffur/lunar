import { create } from 'zustand';
import { defaultAvatarConfigs, type AvatarConfig } from '../components/LiveAvatar/index';

function loadSavedAvatarConfig(userId?: string): AvatarConfig {
    try {
        const key = userId ? `selectedAvatar_${userId}` : 'selectedAvatar';
        const saved = localStorage.getItem(key);
        if (saved) {
            const config = JSON.parse(saved) as AvatarConfig;
            if (config.id && config.name) {
                if (config.id in defaultAvatarConfigs) {
                    return defaultAvatarConfigs[config.id as keyof typeof defaultAvatarConfigs];
                }
                if (config.modelType === 'vrm' && config.modelUrl) {
                    return config;
                }
                if ((config.modelType === '2d' || !config.modelType) && config.layers) {
                    return config;
                }
            }
        }
    } catch (error) {
        console.error('[AvatarStore] Failed to load saved avatar:', error);
    }
    return defaultAvatarConfigs.human;
}

function loadSavedAvatarEnabled(userId?: string): boolean {
    try {
        const key = userId ? `avatarEnabled_${userId}` : 'avatarEnabled';
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            return JSON.parse(saved) === true;
        }
    } catch (error) {
        console.error('[AvatarStore] Failed to load saved avatar enabled state:', error);
    }
    return false;
}

interface AvatarState {
    isEnabled: boolean;
    config: AvatarConfig;
    userId: string | null;
    setEnabled: (enabled: boolean) => void;
    setConfig: (config: AvatarConfig) => void;
    setUserId: (userId: string) => void;
}

export const useAvatarStore = create<AvatarState>((set, get) => ({
    isEnabled: false,
    config: defaultAvatarConfigs.human,
    userId: null,
    setUserId: (userId: string) => {
        set({ userId });
        const enabled = loadSavedAvatarEnabled(userId);
        const config = loadSavedAvatarConfig(userId);
        set({ isEnabled: enabled, config });
    },
    setEnabled: (enabled) => {
        const state = get();
        set({ isEnabled: enabled });
        if (state.userId) {
            try {
                localStorage.setItem(`avatarEnabled_${state.userId}`, JSON.stringify(enabled));
            } catch (error) {
                console.error('[AvatarStore] Failed to save avatar enabled state:', error);
            }
        }
    },
    setConfig: (config) => {
        const state = get();
        set({ config });
        if (state.userId) {
            try {
                localStorage.setItem(`selectedAvatar_${state.userId}`, JSON.stringify(config));
            } catch (error) {
                console.error('[AvatarStore] Failed to save avatar:', error);
            }
        }
    },
}));

