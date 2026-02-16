import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import type { FaceParams, FaceTrackerOptions } from './types';
import { landmarksToFaceParams, normalizeFaceParams } from './utils';

export interface FaceTrackerCallbacks {
  onFaceDetected?: (params: FaceParams) => void;
  onError?: (error: Error) => void;
}

export class FaceTracker {
  private faceMesh: FaceMesh | null = null;
  private camera: Camera | null = null;
  private video: HTMLVideoElement | null = null;
  private isActive = false;
  private callbacks: FaceTrackerCallbacks;
  private options: Required<FaceTrackerOptions>;
  private initialized = false;
  private targetFPS = 30;
  private actualFPS = 0;
  private frameDropThreshold = 20;
  private skipFrames = false;
  private frameCount = 0;
  private lastFPSUpdate = 0;
  private lastFrameTime = 0;
  private debugFrameCount = 0;
  private visibilityHandler: (() => void) | null = null;
  private isTabVisible = true;
  private lastKnownParams: FaceParams | null = null;
  private visibilityCheckInterval: NodeJS.Timeout | null = null;
  private mediaStream: MediaStream | null = null;

  constructor(
    callbacks: FaceTrackerCallbacks,
    options: FaceTrackerOptions = {}
  ) {
    this.callbacks = callbacks;
    this.options = {
      maxNumFaces: options.maxNumFaces ?? 1,
      minDetectionConfidence: options.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: options.minTrackingConfidence ?? 0.5,
      modelComplexity: options.modelComplexity ?? 1,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.faceMesh = new FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      this.faceMesh.setOptions({
        maxNumFaces: this.options.maxNumFaces,
        refineLandmarks: true,
        minDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence,
      });

      this.faceMesh.onResults((results) => {
        if (!this.isActive || !this.faceMesh) return;

        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
          const defaultParams: FaceParams = {
            rotationX: 0,
            rotationY: 0,
            rotationZ: 0,
            leftEyeBlink: 0,
            rightEyeBlink: 0,
            mouthOpen: 0,
            smile: 0,
          };
          this.lastKnownParams = defaultParams;
          this.callbacks.onFaceDetected?.(defaultParams);
          return;
        }

        const rawLandmarks = results.multiFaceLandmarks[0];
        
        const landmarks = rawLandmarks.map((landmark) => ({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z || 0,
        }));

        const params = normalizeFaceParams(landmarksToFaceParams(landmarks));
        this.lastKnownParams = params;
        this.callbacks.onFaceDetected?.(params);
      });

      this.initialized = true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize FaceTracker');
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  async start(videoElement?: HTMLVideoElement): Promise<void> {
    if (this.isActive) {
      return;
    }

    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          frameRate: 30,
        },
      });

      this.mediaStream = stream;

      stream.getVideoTracks().forEach(track => {
        track.addEventListener('ended', () => {
          if (this.isActive) {
            this.restart().catch(() => {});
          }
        });
      });

      if (videoElement) {
        this.video = videoElement;
      } else {
        this.video = document.createElement('video');
        this.video.autoplay = true;
        this.video.playsInline = true;
      }

      this.video.srcObject = stream;
      await this.video.play();

      if (!this.faceMesh) {
        throw new Error('FaceMesh not initialized');
      }

      this.camera = new Camera(this.video, {
        onFrame: async () => {
          if (!this.isActive || !this.faceMesh || !this.video) return;

          const now = performance.now();
          const frameTime = now - this.lastFrameTime;
          this.lastFrameTime = now;

          if (this.skipFrames && this.frameCount % 2 !== 0) {
            this.frameCount++;
            return;
          }

          this.frameCount++;

          if (now - this.lastFPSUpdate > 1000) {
            this.actualFPS = 1000 / frameTime;
            this.lastFPSUpdate = now;

            if (this.actualFPS < this.frameDropThreshold) {
              this.skipFrames = true;
            } else if (this.actualFPS > this.frameDropThreshold + 5) {
              this.skipFrames = false;
            }
          }

          try {
            const start = performance.now();
            await this.faceMesh.send({ image: this.video });
            const detectionTime = performance.now() - start;

            if (detectionTime > 50) {
              this.skipFrames = true;
            }
          } catch (error) {
            if (
              error instanceof Error &&
              (error.message.includes('aborted') ||
                error.message.includes('undefined') ||
                error.message.includes('memory'))
            ) {
              return;
            }
            this.callbacks.onError?.(
              error instanceof Error ? error : new Error('FaceMesh processing error')
            );
          }
        },
        width: 640,
        height: 480,
      });

      this.isActive = true;
      this.camera.start();
      this.setupVisibilityHandling();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start FaceTracker');
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  private setupVisibilityHandling(): void {
    this.isTabVisible = document.visibilityState === 'visible';
    
    this.visibilityHandler = () => {
      this.isTabVisible = document.visibilityState === 'visible';
      
      if (!this.isTabVisible && this.lastKnownParams) {
        this.startVisibilityFallback();
      } else {
        this.stopVisibilityFallback();
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private startVisibilityFallback(): void {
    if (this.visibilityCheckInterval) return;
    
    this.visibilityCheckInterval = setInterval(() => {
      if (!this.isTabVisible && this.lastKnownParams && this.isActive) {
        this.callbacks.onFaceDetected?.(this.lastKnownParams);
      } else if (this.isTabVisible) {
        this.stopVisibilityFallback();
      }
    }, 100);
  }

  private stopVisibilityFallback(): void {
    if (this.visibilityCheckInterval) {
      clearInterval(this.visibilityCheckInterval);
      this.visibilityCheckInterval = null;
    }
  }

  private async restart(): Promise<void> {
    if (!this.isActive) return;
    
    const wasActive = this.isActive;
    const videoEl = this.video;
    await this.stop();
    if (wasActive) {
      await this.start(videoEl || undefined);
    }
  }

  stop(): void {
    this.isActive = false;
    this.stopVisibilityFallback();

    if (this.camera) {
      try {
        this.camera.stop();
      } catch (error) {
      }
      this.camera = null;
    }

    if (this.video?.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
        }
      });
      this.video.srcObject = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
        }
      });
      this.mediaStream = null;
    }

    this.video = null;
  }

  async destroy(): Promise<void> {
    this.stop();

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.faceMesh) {
      try {
        this.faceMesh.close();
      } catch (error) {
      }
      this.faceMesh = null;
    }

    this.initialized = false;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  isRunning(): boolean {
    return this.isActive;
  }

  getPerformanceMetrics() {
    return {
      fps: this.actualFPS,
      targetFPS: this.targetFPS,
      skipFrames: this.skipFrames,
    };
  }
}

