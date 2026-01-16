import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { WS_BASE_URL } from '../config';
import { MessageType, type WSMessage } from '../types/websocket';
import { useAuthRefresh } from '../hooks/useAuthRefresh';

interface WebSocketContextType {
    isConnected: boolean;
    sendMessage: (type: MessageType, payload: any) => void;
    subscribe: <T>(type: MessageType, callback: (payload: T) => void) => void;
    unsubscribe: <T>(type: MessageType, callback: (payload: T) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token } = useSessionStore();
    const { ensureValidToken } = useAuthRefresh();
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const subscribersRef = useRef<Map<MessageType, Set<(payload: any) => void>>>(new Map());
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const connect = useCallback(async () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        const validToken = await ensureValidToken();
        if (!validToken) return;

        const ws = new WebSocket(`${WS_BASE_URL}/api/ws?token=${validToken}`);

        ws.onopen = () => {
            console.log('WS Connected');
            setIsConnected(true);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = undefined;
            }
        };

        ws.onclose = () => {
            console.log('WS Disconnected');
            setIsConnected(false);
            socketRef.current = null;
            // Reconnect logic
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
            console.error('WS Error', error);
        };

        ws.onmessage = (event) => {
            try {
                const message: WSMessage = JSON.parse(event.data);
                const subscribers = subscribersRef.current.get(message.type);
                if (subscribers) {
                    subscribers.forEach(callback => callback(message.payload));
                }
            } catch (err) {
                console.error('Failed to parse WS message', err);
            }
        };

        socketRef.current = ws;
    }, [ensureValidToken]);

    useEffect(() => {
        if (token) {
            connect();
        } else {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            setIsConnected(false);
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [token, connect]);

    const sendMessage = useCallback((type: MessageType, payload: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            const message: WSMessage = { type, payload };
            socketRef.current.send(JSON.stringify(message));
        } else {
            console.warn('WS not connected, cannot send message', type);
        }
    }, []);

    const subscribe = useCallback(<T,>(type: MessageType, callback: (payload: T) => void) => {
        if (!subscribersRef.current.has(type)) {
            subscribersRef.current.set(type, new Set());
        }
        subscribersRef.current.get(type)?.add(callback as any);
    }, []);

    const unsubscribe = useCallback(<T,>(type: MessageType, callback: (payload: T) => void) => {
        subscribersRef.current.get(type)?.delete(callback as any);
    }, []);

    return (
        <WebSocketContext.Provider value={{ isConnected, sendMessage, subscribe, unsubscribe }}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocketContext = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocketContext must be used within a WebSocketProvider');
    }
    return context;
};
