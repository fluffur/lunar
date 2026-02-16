export interface FaceParams {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  leftEyeBlink: number;
  rightEyeBlink: number;
  mouthOpen: number;
  smile: number;
}

export interface AvatarData {
  userId: string;
  localTimestamp: number;
  serverTimestamp?: number;
  sequenceNumber: number;
  face: FaceParams;
  avatarConfig?: AvatarConfig;
  isAvatarEnabled?: boolean;
}

export interface AvatarConfig {
  id: string;
  name: string;
  type: 'default' | 'custom' | 'vrm';
  // Для 2D аватаров
  layers?: AvatarLayer[];
  // Для 3D VRM моделей
  modelType?: '2d' | 'vrm';
  modelUrl?: string;
}

export interface AvatarLayer {
  id: string;
  type: 'head' | 'eye' | 'mouth' | 'decoration';
  imageUrl?: string;
  color?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: { min: number; max: number };
  scale?: { min: number; max: number };
  animationRules?: AnimationRule[];
}

export interface AnimationRule {
  param: keyof FaceParams;
  transform: 'rotation' | 'scale' | 'opacity' | 'position';
  mapping: (value: number) => number;
}

export interface FaceTrackerOptions {
  maxNumFaces?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  modelComplexity?: 0 | 1 | 2;
}

export interface AvatarRendererOptions {
  width?: number;
  height?: number;
  fps?: number;
}

