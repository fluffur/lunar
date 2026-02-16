import type { AvatarData } from './types';

export class AvatarDataTransmitter {
  private dataChannel: RTCDataChannel | null = null;
  private listeners: Set<(data: AvatarData) => void> = new Set();
  private isConnected = false;
  private sendQueue: AvatarData[] = [];
  private isSending = false;
  private lastSendTime = 0;
  private sequenceNumber = 0;
  private droppedFrames = 0;

  constructor(dataChannel: RTCDataChannel) {
    this.dataChannel = dataChannel;
    this.setupDataChannel();
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return;

    this.dataChannel.onopen = () => {
      this.isConnected = true;
    };

    this.dataChannel.onclose = () => {
      this.isConnected = false;
    };

    this.dataChannel.onerror = (error) => {
      console.error('[AvatarDataTransmitter] Data channel error:', error);
    };

    this.dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AvatarData;
        this.listeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error('[AvatarDataTransmitter] Failed to parse message:', error);
      }
    };
  }

  send(data: AvatarData): void {
    if (!this.isConnected || !this.dataChannel) {
      return;
    }

    if (this.dataChannel.bufferedAmount > 65536) {
      this.droppedFrames++;
      if (this.droppedFrames % 30 === 0) {
        console.warn('[AvatarDataTransmitter] DataChannel buffer full, dropping frames');
      }
      return;
    }

    const now = Date.now();
    if (now - this.lastSendTime < 33) {
      return;
    }

    try {
      const dataWithSequence: AvatarData = {
        ...data,
        sequenceNumber: this.sequenceNumber++,
        localTimestamp: now,
      };

      const json = JSON.stringify(dataWithSequence);
      this.dataChannel.send(json);
      this.lastSendTime = now;
    } catch (error) {
      console.error('[AvatarDataTransmitter] Failed to send data:', error);
    }
  }

  onData(callback: (data: AvatarData) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  destroy(): void {
    this.listeners.clear();
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    this.isConnected = false;
  }
}

export function createAvatarDataChannel(peerConnection: RTCPeerConnection): RTCDataChannel {
  const dataChannel = peerConnection.createDataChannel('avatar-data', {
    ordered: true,
    maxRetransmits: 3,
  });

  return dataChannel;
}

export function setupAvatarDataChannel(
  peerConnection: RTCPeerConnection,
  onDataChannel: (transmitter: AvatarDataTransmitter) => void
): void {
  peerConnection.ondatachannel = (event) => {
    const channel = event.channel;
    if (channel.label === 'avatar-data') {
      const transmitter = new AvatarDataTransmitter(channel);
      onDataChannel(transmitter);
    }
  };
}

