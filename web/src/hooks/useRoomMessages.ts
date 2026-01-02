import { useState, useEffect, useCallback } from 'react';
import { messageApi } from '../api';
import axios from 'axios';
import type { ModelMessage } from '../../api';

export function useRoomMessages(roomSlug: string | undefined) {
    const [messages, setMessages] = useState<ModelMessage[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const fetchInitialMessages = useCallback(async () => {
        if (!roomSlug) return;
        setNotFound(false);
        try {
            const { data } = await messageApi.roomsRoomSlugMessagesGet(roomSlug, 10);
            setMessages(data.messages?.reverse() ?? []);
            setNextCursor(data.nextCursor ?? null);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                setNotFound(true);
            }
            console.error("Failed to fetch messages:", error);
        }
    }, [roomSlug]);

    const loadOlderMessages = useCallback(async (onScrollAdjust: (prevHeight: number) => void) => {
        if (!nextCursor || loading || !roomSlug) return;

        setLoading(true);
        try {
            const { data } = await messageApi.roomsRoomSlugMessagesGet(
                roomSlug,
                5,
                encodeURIComponent(nextCursor),
            );

            setMessages(prev => [...data.messages?.reverse() ?? [], ...prev]);
            setNextCursor(data.nextCursor ?? null);

            onScrollAdjust(0);
            return true;
        } catch (err) {
            console.error("Failed to load older messages:", err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [nextCursor, loading, roomSlug]);

    const addMessage = useCallback((message: ModelMessage) => {
        setMessages(prev => [...prev, message]);
    }, []);

    useEffect(() => {
        fetchInitialMessages();
    }, [fetchInitialMessages]);

    return {
        messages,
        setMessages,
        nextCursor,
        loading,
        notFound,
        loadOlderMessages,
        addMessage
    };
}
