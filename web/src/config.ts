export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
export const API_UPLOADS_BASE_URL = API_BASE_URL + "/uploads/"
export const API_AVATARS_BASE_URL = API_UPLOADS_BASE_URL + "/avatars/"
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8080";
