const protocol = window.location.protocol;
const host = window.location.host;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `${protocol}//${host.replace(/:\d+$/, ':8080')}`;
export const API_UPLOADS_BASE_URL = `${API_BASE_URL}/uploads`;
export const API_AVATARS_BASE_URL = `${API_UPLOADS_BASE_URL}/avatars/`;

const wsProtocol = protocol === "https:" ? "wss:" : "ws:";
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || `${wsProtocol}//${host.replace(/:\d+$/, ':8080')}`;

// LiveKit configuration
export const LIVEKIT_WS_URL = import.meta.env.VITE_LIVEKIT_WS_URL || 'ws://localhost:7880';
