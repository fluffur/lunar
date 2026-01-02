import {create} from 'zustand';

type User = {
    id: string;
    username: string;
    email: string;
    emailVerified: boolean;
    avatarUrl?: string | null;
}

interface SessionState {
    user: User | null;
    token: string | null;
    initialized: boolean;
    setUser: (user: User | null) => void;
    setToken: (token: string) => void;
    setInitialized: () => void;
    logout: () => void;

}

export const useSessionStore = create<SessionState>(
    (set) => ({
        user: null,
        token: null,
        initialized: false,
        avatarUrl: null,
        email: null,
        emailVerified: null,

        setUser: (user) => set({user}),

        setToken: (token) => set({token}),

        setInitialized: () => set({initialized: true}),

        logout: () =>
            set({
                user: null,
                token: null,
            }),

    }),
);
