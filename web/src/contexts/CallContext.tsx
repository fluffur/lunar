import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from './WebSocketContext';
import { MessageType, type IncomingCallPayload } from '../types/websocket';
import { Modal, Button, Text, Group, Stack } from '@mantine/core';

interface CallContextType {
    incomingCall: IncomingCallPayload | null;
    acceptCall: () => void;
    declineCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { subscribe, unsubscribe } = useWebSocketContext();
    const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);

    const handleIncomingCall = useCallback((payload: IncomingCallPayload) => {
        console.log("Incoming call:", payload);
        setIncomingCall(payload);
    }, []);

    useEffect(() => {
        subscribe(MessageType.IncomingCall, handleIncomingCall);
        return () => unsubscribe(MessageType.IncomingCall, handleIncomingCall);
    }, [subscribe, unsubscribe, handleIncomingCall]);

    const acceptCall = () => {
        if (incomingCall) {
            // Join the room using LiveKit
            // For now, assume redirection or trigger LiveKit connection
            console.log("Accepting call, room:", incomingCall.room_name);
            // Ideally navigate to a call page or overlay
            // Since this is MVP, maybe just alert or log token?
            // Actually, we can use `window.location.href` to join a room via URL?
            // Or better, set some "ActiveCall" state.

            // For direct calls, we probably want to navigate to a special Call Room route.
            // But we don't have that yet.
            // Let's just create a temporary room route or use existing Room page if it supports direct calls?
            // But Direct Call rooms are random UUID rooms that might not be persistent "rooms" in DB used by `Room.tsx`.
            // Wait, backend `InitiateCall` generated a random name.
            // Did it create a Room entity in DB? NO.
            // `internal/call/service.go` just generated token.
            // So `Room.tsx` which fetches messages/room from DB will FAIL if we navigate to it with slug=roomName.

            // So we need a pure LiveKit Call component/page that doesn't rely on backend Room entity.
            // Or we should have created a Room entity?
            // Direct calls usually don't need persistent chat history rooms.
            // So we should have a `Call` page that accepts token/roomName directly.

            setIncomingCall(null);
            // Navigate to /call/roomName ?
            // Need to implement such route/page.
        }
    };

    const declineCall = () => {
        setIncomingCall(null);
        // Signal rejection to backend? (Not implemented in backend yet)
    };

    return (
        <CallContext.Provider value={{ incomingCall, acceptCall, declineCall }}>
            {children}
            <Modal opened={!!incomingCall} onClose={declineCall} title="Incoming Call" centered>
                {incomingCall && (
                    <Stack align="center">
                        <Text size="lg" fw={700}>{incomingCall.caller_name}</Text>
                        <Text>is calling you...</Text>
                        <Group mt="md">
                            <Button color="red" onClick={declineCall}>Decline</Button>
                            <Button color="green" onClick={acceptCall}>Accept</Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};
