import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from './WebSocketContext';
import { MessageType, type IncomingCallPayload } from '../types/websocket';
import { Modal, Button, Text, Group, Stack } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

interface CallContextType {
    incomingCall: IncomingCallPayload | null;
    acceptCall: () => void;
    declineCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { subscribe, unsubscribe } = useWebSocketContext();
    const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
    const navigate = useNavigate();

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
            const roomName = incomingCall.room_name;
            setIncomingCall(null);
            navigate(`/call/${roomName}`);
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
