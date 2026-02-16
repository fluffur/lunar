import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { FaceTracker, type FaceTrackerCallbacks } from '../components/LiveAvatar/FaceTracker';
import { AvatarRenderer } from '../components/LiveAvatar/AvatarRenderer';
import { AvatarRenderer3D } from '../components/LiveAvatar/AvatarRenderer3D';
import type { FaceParams, AvatarConfig, AvatarData } from '../components/LiveAvatar/types';
import { defaultAvatarConfigs } from '../components/LiveAvatar/avatarConfigs';

// Общий интерфейс для 2D и 3D рендереров
interface AvatarRendererInterface {
  draw(params: FaceParams | null): void;
  dispose(): void;
  getStream(fps?: number): MediaStream;
  getCanvas(): HTMLCanvasElement;
  updateConfig?(config: AvatarConfig): void;
  updateModel?(url: string): Promise<void>;
}

interface UseLiveAvatarOptions {
  enabled: boolean;
  avatarConfig: AvatarConfig;
  userId: string;
  onDataReady?: (data: AvatarData) => void;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
}

export function useLiveAvatar({
  enabled,
  avatarConfig,
  userId,
  onDataReady,
  onStreamReady,
  onError,
}: UseLiveAvatarOptions) {
  const faceTrackerRef = useRef<FaceTracker | null>(null);
  const avatarRendererRef = useRef<AvatarRendererInterface | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isActiveRef = useRef(false);
  const initializedRef = useRef(false);
  const mountedRef = useRef(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastParamsRef = useRef<FaceParams | null>(null);
  const frameRateRef = useRef(30);
  const lastFrameTimeRef = useRef(0);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const prevEnabledRef = useRef(enabled);
  const prevAvatarConfigIdRef = useRef(avatarConfig.id);

  const stableAvatarConfig = useMemo(() => avatarConfig, [avatarConfig.id]);

  const handleFaceDetected = useCallback(
    (params: FaceParams) => {
      if (!isActiveRef.current || !avatarRendererRef.current) return;

      const now = performance.now();
      const elapsed = now - lastFrameTimeRef.current;
      const targetInterval = 1000 / frameRateRef.current;

      if (elapsed < targetInterval && document.visibilityState === 'visible') {
        return;
      }

      lastFrameTimeRef.current = now;
      lastParamsRef.current = params;

      avatarRendererRef.current.draw(params);

      if (onDataReady) {
        const data: AvatarData = {
          userId,
          localTimestamp: Date.now(),
          sequenceNumber: 0,
          face: params,
          avatarConfig: stableAvatarConfig,
          isAvatarEnabled: enabled,
        };
        onDataReady(data);
      }
    },
    [userId, onDataReady, enabled, stableAvatarConfig]
  );

  const handleError = useCallback(
    (err: Error) => {
      setError(err.message);
      onError?.(err);
    },
    [onError]
  );

  useEffect(() => {
    mountedRef.current = true;
    
    if (!enabled) {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      if (faceTrackerRef.current) {
        faceTrackerRef.current.stop();
        faceTrackerRef.current.destroy();
        faceTrackerRef.current = null;
      }
      if (avatarRendererRef.current) {
        avatarRendererRef.current.dispose();
        avatarRendererRef.current = null;
      }
      isActiveRef.current = false;
      initializedRef.current = false;
      isInitializingRef.current = false;
      setIsReady(false);
      return;
    }

    if (initializedRef.current && !isInitializingRef.current) {
      return;
    }

    if (isInitializingRef.current) {
      return;
    }

    const initializeAvatar = async () => {
      if (!mountedRef.current) {
        isInitializingRef.current = false;
        return;
      }

      if (isInitializingRef.current) {
        return;
      }

      isInitializingRef.current = true;

      try {
        initializedRef.current = true;
        isActiveRef.current = true;
        setError(null);

        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        canvasRef.current = canvas;

        if (!mountedRef.current) {
          isInitializingRef.current = false;
          return;
        }

        // Определяем тип рендерера на основе modelType
        const modelType = stableAvatarConfig.modelType || '2d';
        let renderer: AvatarRendererInterface;

        if (modelType === 'vrm') {
          // 3D VRM рендерер
          if (!stableAvatarConfig.modelUrl) {
            throw new Error('VRM model URL is required for 3D avatars');
          }

          try {
            renderer = new AvatarRenderer3D(canvas);
            await (renderer as AvatarRenderer3D).loadModel(stableAvatarConfig.modelUrl);
          } catch (vrmError) {
            // Fallback на 2D human аватар если VRM модель не загрузилась
            // VRM model failed to load, falling back to 2D avatar
            const fallbackConfig = defaultAvatarConfigs.human;
            renderer = new AvatarRenderer(canvas, fallbackConfig);
            // Обновляем конфиг в store на fallback
            if (onError) {
              onError(new Error(`Failed to load VRM model: ${vrmError instanceof Error ? vrmError.message : 'Unknown error'}. Using 2D avatar instead.`));
            }
          }
        } else {
          // 2D рендерер (по умолчанию)
          if (!stableAvatarConfig.layers) {
            // Fallback на дефолтный human аватар если layers отсутствуют
            const fallbackConfig = defaultAvatarConfigs.human;
            renderer = new AvatarRenderer(canvas, fallbackConfig);
          } else {
            renderer = new AvatarRenderer(canvas, stableAvatarConfig);
          }
        }

        avatarRendererRef.current = renderer;

        if (!mountedRef.current) {
          renderer.dispose();
          isInitializingRef.current = false;
          return;
        }

        const callbacks: FaceTrackerCallbacks = {
          onFaceDetected: handleFaceDetected,
          onError: handleError,
        };

        const tracker = new FaceTracker(callbacks, {
          maxNumFaces: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
          modelComplexity: 1,
        });

        faceTrackerRef.current = tracker;

        if (!mountedRef.current) {
          tracker.destroy();
          isInitializingRef.current = false;
          return;
        }

        await tracker.initialize();

        if (!mountedRef.current) {
          tracker.destroy();
          isInitializingRef.current = false;
          return;
        }

        await tracker.start();

        if (!mountedRef.current) {
          tracker.destroy();
          isInitializingRef.current = false;
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        if (!mountedRef.current) {
          tracker.destroy();
          isInitializingRef.current = false;
          return;
        }

        if (isActiveRef.current && renderer) {
          const stream = renderer.getStream(frameRateRef.current);

          if (!mountedRef.current) {
            stream.getTracks().forEach(track => track.stop());
            tracker.destroy();
            isInitializingRef.current = false;
            return;
          }

          setIsReady(true);
          onStreamReady?.(stream);
        }
      } catch (err) {
        if (!mountedRef.current) {
          isInitializingRef.current = false;
          return;
        }
        initializedRef.current = false;
        isActiveRef.current = false;
        const error = err instanceof Error ? err : new Error('Failed to initialize live avatar');
        setError(error.message);
        handleError(error);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) {
        return;
      }
      initTimeoutRef.current = null;
      initializeAvatar();
    }, 200);

    return () => {
      mountedRef.current = false;
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }

      isActiveRef.current = false;
      isInitializingRef.current = false;
      
      if (faceTrackerRef.current) {
        faceTrackerRef.current.destroy();
        faceTrackerRef.current = null;
      }
      if (avatarRendererRef.current) {
        avatarRendererRef.current.dispose();
        avatarRendererRef.current = null;
      }
      canvasRef.current = null;
      initializedRef.current = false;
      setIsReady(false);
    };
  }, [enabled, stableAvatarConfig.id, handleFaceDetected, handleError, onStreamReady]);

  useEffect(() => {
    if (avatarRendererRef.current && enabled && isReady) {
      const modelType = stableAvatarConfig.modelType || '2d';
      
      // Для 2D аватаров обновляем конфиг
      if (modelType === '2d' && avatarRendererRef.current.updateConfig) {
        avatarRendererRef.current.updateConfig(stableAvatarConfig);
        if (lastParamsRef.current) {
          avatarRendererRef.current.draw(lastParamsRef.current);
        }
      }
      // Для 3D VRM моделей обновляем модель если URL изменился
      else if (modelType === 'vrm' && stableAvatarConfig.modelUrl && avatarRendererRef.current.updateModel) {
        avatarRendererRef.current.updateModel(stableAvatarConfig.modelUrl).catch((err) => {
          // Failed to update VRM model
          handleError(new Error('Failed to update VRM model'));
        });
      }
    }
  }, [stableAvatarConfig.id, stableAvatarConfig.modelUrl, enabled, isReady, handleError]);

  const updateAvatar = useCallback((newConfig: AvatarConfig) => {
    if (avatarRendererRef.current) {
      const modelType = newConfig.modelType || '2d';
      
      if (modelType === '2d' && avatarRendererRef.current.updateConfig) {
        avatarRendererRef.current.updateConfig(newConfig);
        if (lastParamsRef.current) {
          avatarRendererRef.current.draw(lastParamsRef.current);
        }
      } else if (modelType === 'vrm' && newConfig.modelUrl && avatarRendererRef.current.updateModel) {
        avatarRendererRef.current.updateModel(newConfig.modelUrl).catch((err) => {
          // Failed to update VRM model
        });
      }
    }
  }, []);

  return {
    isReady,
    error,
    updateAvatar,
    getCanvas: () => canvasRef.current,
  };
}

