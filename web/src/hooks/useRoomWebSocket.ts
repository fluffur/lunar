import { useState, useEffect, useCallback } from 'react';
import useWebSocket from 'react-use-websocket';
import { WS_BASE_URL } from '../config';
import { useAuthRefresh } from './useAuthRefresh';
import type { ModelMessage } from '../../api';

interface UseRoomWebSocketProps {
    roomSlug: string | undefined;
    onMessageReceived: (message: ModelMessage) => void;
}

export function useRoomWebSocket({ roomSlug, onMessageReceived }: UseRoomWebSocketProps) {
    const { token, ensureValidToken } = useAuthRefresh();
    const [socketUrl, setSocketUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!roomSlug) {
            return;
        }

        const prepareSocket = async () => {
            const validToken = await ensureValidToken();
            if (validToken) {
                setSocketUrl(`${WS_BASE_URL}/api/rooms/${roomSlug}/ws?token=${validToken}`);
            } else {
                setSocketUrl(null);
            }
        };

        prepareSocket();
    }, [roomSlug, token, ensureValidToken]);

    const { sendMessage } = useWebSocket(socketUrl, {
        shouldReconnect: () => {
            ensureValidToken().catch(() => { });
            return true;
        },
        reconnectAttempts: 20,
        reconnectInterval: 3000,
        onMessage: (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessageReceived(data);
            } catch (err) {
                console.error("Failed to parse WS message:", err);
            }
        },
    });

    const sendRoomMessage = useCallback((content: string) => {
        if (content.trim()) {
            sendMessage(content.trim().replace(/\n\n+/g, '\n\n'));
        }
    }, [sendMessage]);

    return { sendRoomMessage };
}
