export enum ConnectionState {
    Disconnected = 'disconnected',
    Connecting = 'connecting',
    Connected = 'connected',
    Reconnecting = 'reconnecting',
    Error = 'error'
}

export interface LiveKitError {
    message: string;
    code?: string;
    timestamp: Date;
}

export interface ParticipantInfo {
    identity: string;
    name?: string;
    isSpeaking: boolean;
    isCameraEnabled: boolean;
    isMicrophoneEnabled: boolean;
}
