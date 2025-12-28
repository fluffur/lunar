import {create} from 'zustand';

type ColorScheme = 'light' | 'dark';

interface UiState {
    colorScheme: ColorScheme;
    primaryColor: string;

    setColorScheme: (scheme: ColorScheme) => void;
    setPrimaryColor: (color: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
    colorScheme: localStorage.getItem('theme') as ColorScheme || 'dark',
    primaryColor: localStorage.getItem('primaryColor') || 'teal',

    setColorScheme: (colorScheme) => {
        localStorage.setItem('theme', colorScheme);
        set({ colorScheme });
    },

    setPrimaryColor: (primaryColor) => {
        localStorage.setItem('primaryColor', primaryColor);
        set({ primaryColor });
    },
}));