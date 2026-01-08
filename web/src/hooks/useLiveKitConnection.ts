import { useEffect, useState, useCallback } from 'react';
import { livekitApi } from '../api.ts';
import { ConnectionState, type LiveKitError } from '../components/Livekit/types.ts';

interface UseLiveKitConnectionResult {
    token: string | null;
    connectionState: ConnectionState;
    error: LiveKitError | null;
    retry: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function useLiveKitConnection(roomSlug: string): UseLiveKitConnectionResult {
    const [token, setToken] = useState<string | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
    const [error, setError] = useState<LiveKitError | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const fetchToken = useCallback(async () => {
        setConnectionState(ConnectionState.Connecting);
        setError(null);

        try {
            const response = await livekitApi.livekitTokenRoomSlugGet(roomSlug);
            const fetchedToken = response.data.token;

            if (!fetchedToken) {
                throw new Error('No token received from server');
            }

            setToken(fetchedToken);
            setConnectionState(ConnectionState.Connected);
            setRetryCount(0);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get LiveKit token';
            const liveKitError: LiveKitError = {
                message: errorMessage,
                timestamp: new Date()
            };

            setError(liveKitError);
            setConnectionState(ConnectionState.Error);

            console.error('[LiveKit] Token fetch error:', errorMessage, err);

            // Auto-retry logic
            if (retryCount < MAX_RETRIES) {
                console.log(`[LiveKit] Retrying in ${RETRY_DELAY}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
                setTimeout(() => {
                    setRetryCount(prev => prev + 1);
                }, RETRY_DELAY);
            }
        }
    }, [roomSlug, retryCount]);

    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    const retry = useCallback(() => {
        setRetryCount(0);
        fetchToken();
    }, [fetchToken]);

    return {
        token,
        connectionState,
        error,
        retry
    };
}
