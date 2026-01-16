import { useEffect, useCallback, useState, useRef } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { MessageType } from '../types/websocket';
import { roomApi } from '../api';
import type { ModelMessage } from '../../api';

interface UseRoomWebSocketProps {
    roomSlug: string | undefined;
    onMessageReceived: (message: ModelMessage) => void;
}

export function useRoomWebSocket({ roomSlug, onMessageReceived }: UseRoomWebSocketProps) {
    const { sendMessage, subscribe, unsubscribe, isConnected } = useWebSocketContext();
    const [roomId, setRoomId] = useState<string | null>(null);
    const joinedRef = useRef(false);

    // Join room and get ID
    useEffect(() => {
        if (!roomSlug) return;

        let active = true;

        const joinRoom = async () => {
            try {
                // @ts-ignore - API response type needs update, manually handling
                const response = await roomApi.roomsRoomSlugPost(roomSlug);
                // response.data should be the Room object now
                const room = response.data as any;
                if (active && room && room.id) {
                    setRoomId(room.id);
                }
            } catch (err) {
                console.error("Failed to join room/fetch ID:", err);
            }
        };

        joinRoom();

        return () => { active = false; };
    }, [roomSlug]);

    // Handle WS Join/Leave
    useEffect(() => {
        if (!isConnected || !roomId) return;

        // Send join_room
        if (!joinedRef.current) {
            sendMessage(MessageType.JoinRoom, { room_id: roomId });
            joinedRef.current = true;
        }

        return () => {
            if (isConnected && joinedRef.current) {
                sendMessage(MessageType.LeaveRoom, { room_id: roomId });
                joinedRef.current = false;
            }
        };
    }, [isConnected, roomId, sendMessage]);

    // Listen for messages
    useEffect(() => {
        if (!roomId) return;

        const handleMessage = (payload: any) => {
            // Verify if message belongs to this room
            // The payload is likely ChatMessage or ModelMessage from backend
            // Backend sends `MsgChatMessage` -> `client.Send(MsgNewMessage, payload)`
            // payload is the message object. 
            // We need to check if it has roomID or we rely on backend sending correct messages?
            // But existing Global WS sends ALL messages to 'chat_message'?
            // Wait, backend `routeMessage`:
            // `s.PublishRoomEvent(ctx, payload.RoomID, MsgNewMessage, message)`
            // And `HandleWebSocket`: `sub := s.rdb.Subscribe(ctx, userChannel)`
            // Wait. `Subscribe` subscribes to `user:{id}`.
            // But when joining room, client sends `MsgJoinRoom`.
            // `processClientMessage` `MsgJoinRoom` -> `sub.Subscribe(ctx, roomChannel)`.
            // So this websocket connection IS subscribed to the Redis room channel!
            // So any message published to that channel will come through this WS.
            // So we just need to filter by RoomID if we are subscribed to multiple?
            // But typically user is in one active room view.
            // Safer to filter.

            const msg = payload as ModelMessage;
            if (msg.roomID === roomId) {
                onMessageReceived(msg);
            }
        };

        subscribe(MessageType.NewMessage, handleMessage);

        return () => {
            unsubscribe(MessageType.NewMessage, handleMessage);
        };
    }, [roomId, subscribe, unsubscribe, onMessageReceived]);

    const sendRoomMessage = useCallback((content: string) => {
        if (content.trim() && roomId) {
            sendMessage(MessageType.ChatMessage, {
                room_id: roomId,
                content: content.trim().replace(/\n\n+/g, '\n\n')
            });
        }
    }, [sendMessage, roomId]);

    return { sendRoomMessage };
}
