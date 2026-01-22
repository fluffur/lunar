import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useWebSocketContext } from './WebSocketContext';
import { MessageType, type IncomingCallPayload } from '../types/websocket';
import { Modal, Text, Stack, Group, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../components/UserAvatar.tsx';
import { api } from '../api';

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

    const acceptCall = async () => {
        if (incomingCall) {
            const roomName = incomingCall.room_name;
            setIncomingCall(null);
            try {
                await api.delete('/call/active');
            } catch (err) {
                console.error('Failed to clear active call', err);
            }
            navigate(`/call/${roomName}`);
        }
    };

    const declineCall = async () => {
        setIncomingCall(null);
        try {
            await api.delete('/call/active');
        } catch (err) {
            console.error('Failed to clear active call', err);
        }
    };

    return (
        <CallContext.Provider value={{ incomingCall, acceptCall, declineCall }}>
            {children}
            <Modal opened={!!incomingCall} onClose={declineCall} centered withCloseButton>
                {incomingCall && (
                    <Stack align="center" gap="md" py="md">
                        <UserAvatar 
                            username={incomingCall.caller_name} 
                            avatarUrl={incomingCall.caller_avatar_url || undefined}
                            size={80}
                            radius="50%"
                        />
                        <Text size="lg" fw={700}>{incomingCall.caller_name}</Text>
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
