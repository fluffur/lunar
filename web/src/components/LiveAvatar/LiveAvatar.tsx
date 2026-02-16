import { useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { DataPacket_Kind, ConnectionState } from 'livekit-client';
import { useLiveAvatar } from '../../hooks/useLiveAvatar';
import type { AvatarConfig, AvatarData } from './types';

interface LiveAvatarProps {
  enabled: boolean;
  avatarConfig: AvatarConfig;
  userId: string;
  onDataReady?: (data: AvatarData) => void;
}

export function LiveAvatar({
  enabled,
  avatarConfig,
  userId,
  onDataReady,
}: LiveAvatarProps) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const trackPublicationRef = useRef<any>(null);
  const publishingRef = useRef(false);
  const lastConfigSentRef = useRef<string>('');
  const connectionStateRef = useRef<ConnectionState>(ConnectionState.Disconnected);

  const stableAvatarConfig = useMemo(() => avatarConfig, [avatarConfig.id]);

  const unpublishAllCameraTracks = useCallback(async () => {
    if (!localParticipant) {
      return;
    }

    const publications = Array.from(localParticipant.trackPublications.values());
    const cameraPublications = publications.filter((pub) => pub.source === 'camera' && pub.track);

    const unpublishPromises = cameraPublications.map((pub) => {
      try {
        return localParticipant.unpublishTrack(pub.track!);
      } catch (err) {
        return Promise.resolve();
      }
    });

    await Promise.all(unpublishPromises);
  }, [localParticipant]);

  const handleStreamReady = useCallback(
    async (stream: MediaStream) => {
      if (!localParticipant || !enabled) {
        return;
      }

      if (publishingRef.current) {
        return;
      }

      if (connectionStateRef.current !== ConnectionState.Connected) {
        return;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        return;
      }

      publishingRef.current = true;
      streamRef.current = stream;

      try {
        await unpublishAllCameraTracks();
        
        if (trackRef.current && trackRef.current.readyState !== 'ended') {
          trackRef.current.stop();
        }
        trackRef.current = null;
        trackPublicationRef.current = null;

        const publication = await localParticipant.publishTrack(videoTrack, {
          source: 'camera',
        });
        
        trackRef.current = videoTrack;
        trackPublicationRef.current = publication;
        publishingRef.current = false;
      } catch (error) {
        console.error('[LiveAvatar] Failed to publish track:', error);
        publishingRef.current = false;
        if (videoTrack.readyState !== 'ended') {
          videoTrack.stop();
        }
      }
    },
    [localParticipant, unpublishAllCameraTracks, enabled]
  );

  const handleDataReady = useCallback(
    (data: AvatarData) => {
      onDataReady?.(data);
      
      if (localParticipant && connectionStateRef.current === ConnectionState.Connected) {
        try {
          const json = JSON.stringify(data);
          const encoder = new TextEncoder();
          const dataToSend = encoder.encode(json);
          localParticipant.publishData(dataToSend, DataPacket_Kind.RELIABLE).catch((error) => {
            if (error.message && !error.message.includes('PC manager is closed')) {
              console.error('[LiveAvatar] Failed to send avatar data:', error);
            }
          });
        } catch (error) {
          if (error instanceof Error && !error.message.includes('PC manager is closed')) {
            console.error('[LiveAvatar] Failed to send avatar data:', error);
          }
        }
      }
    },
    [onDataReady, localParticipant]
  );

  const { isReady, error } = useLiveAvatar({
    enabled,
    avatarConfig: stableAvatarConfig,
    userId,
    onDataReady: handleDataReady,
    onStreamReady: handleStreamReady,
  });

  useEffect(() => {
    if (!room) return;

    const updateConnectionState = () => {
      const newState = room.state;
      const wasConnected = connectionStateRef.current === ConnectionState.Connected;
      const isConnected = newState === ConnectionState.Connected;
      
      connectionStateRef.current = newState;

      if (wasConnected && !isConnected) {
        if (trackRef.current && trackRef.current.readyState !== 'ended') {
          trackRef.current.stop();
        }
        trackRef.current = null;
        trackPublicationRef.current = null;
        publishingRef.current = false;
      }

      if (!wasConnected && isConnected && enabled && streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack && videoTrack.readyState === 'live') {
          handleStreamReady(streamRef.current);
        }
      }
    };

    room.on('connectionStateChanged', updateConnectionState);
    updateConnectionState();

    return () => {
      room.off('connectionStateChanged', updateConnectionState);
    };
  }, [room, enabled, handleStreamReady]);

  useEffect(() => {
    if (!localParticipant) {
      return;
    }

    if (connectionStateRef.current !== ConnectionState.Connected) {
      return;
    }

    if (enabled) {
      const configKey = `${avatarConfig.id}_${JSON.stringify(avatarConfig)}`;
      if (lastConfigSentRef.current !== configKey) {
        const configData: AvatarData = {
          userId,
          localTimestamp: Date.now(),
          sequenceNumber: -1,
          face: {
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            leftEyeBlink: 0,
            rightEyeBlink: 0,
            mouthOpen: 0,
            smile: 0,
          },
          avatarConfig: stableAvatarConfig,
          isAvatarEnabled: true,
        };
        
        try {
          const json = JSON.stringify(configData);
          const encoder = new TextEncoder();
          const dataToSend = encoder.encode(json);
          localParticipant.publishData(dataToSend, DataPacket_Kind.RELIABLE).catch((error) => {
            if (error.message && !error.message.includes('PC manager is closed')) {
              console.error('[LiveAvatar] Failed to send avatar config:', error);
            }
          });
          lastConfigSentRef.current = configKey;
        } catch (error) {
          if (error instanceof Error && !error.message.includes('PC manager is closed')) {
            console.error('[LiveAvatar] Failed to send avatar config:', error);
          }
        }
      }

      unpublishAllCameraTracks().then(() => {
        if (localParticipant.isCameraEnabled) {
          localParticipant.setCameraEnabled(false);
        }
      });
    } else {
      const disableData: AvatarData = {
        userId,
        localTimestamp: Date.now(),
        sequenceNumber: -1,
        face: {
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          leftEyeBlink: 0,
          rightEyeBlink: 0,
          mouthOpen: 0,
          smile: 0,
        },
        isAvatarEnabled: false,
      };
      
      try {
        const json = JSON.stringify(disableData);
        const encoder = new TextEncoder();
        const dataToSend = encoder.encode(json);
        localParticipant.publishData(dataToSend, DataPacket_Kind.RELIABLE).catch((error) => {
          if (error.message && !error.message.includes('PC manager is closed')) {
            console.error('[LiveAvatar] Failed to send disable signal:', error);
          }
        });
      } catch (error) {
        if (error instanceof Error && !error.message.includes('PC manager is closed')) {
          console.error('[LiveAvatar] Failed to send disable signal:', error);
        }
      }

      if (trackPublicationRef.current) {
        localParticipant.unpublishTrack(trackPublicationRef.current.track).catch(() => {});
        trackPublicationRef.current = null;
      }
      if (trackRef.current && trackRef.current.readyState !== 'ended') {
        trackRef.current.stop();
      }
      trackRef.current = null;
      localParticipant.setCameraEnabled(true);
    }
  }, [enabled, localParticipant, unpublishAllCameraTracks, avatarConfig, stableAvatarConfig, userId]);

  useEffect(() => {
    return () => {
      if (localParticipant) {
        unpublishAllCameraTracks().catch(() => {});
        if (trackPublicationRef.current) {
          localParticipant.unpublishTrack(trackPublicationRef.current.track).catch(() => {});
          trackPublicationRef.current = null;
        }
      }
      if (trackRef.current && trackRef.current.readyState !== 'ended') {
        trackRef.current.stop();
        trackRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          if (track.readyState !== 'ended') {
            track.stop();
          }
        });
        streamRef.current = null;
      }
    };
  }, [localParticipant, unpublishAllCameraTracks]);

  if (error) {
    return null;
  }

  return null;
}

export const LiveAvatarMemo = memo(LiveAvatar, (prevProps, nextProps) => {
  return (
    prevProps.enabled === nextProps.enabled &&
    prevProps.userId === nextProps.userId &&
    prevProps.avatarConfig.id === nextProps.avatarConfig.id
  );
});

