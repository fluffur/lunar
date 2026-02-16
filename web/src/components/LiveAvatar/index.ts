export { LiveAvatar } from './LiveAvatar';
export { RemoteAvatar } from './RemoteAvatar';
export { AvatarSelector } from './AvatarSelector';
export { AvatarUpload } from './AvatarUpload';
export { FaceTracker } from './FaceTracker';
export { AvatarRenderer } from './AvatarRenderer';
export { AvatarRenderer3D } from './AvatarRenderer3D';
export { AvatarDataTransmitter, createAvatarDataChannel, setupAvatarDataChannel } from './dataTransmission';
export { defaultAvatarConfigs, createCustomAvatarConfig, loadAvatarConfigFromJSON } from './avatarConfigs';
export type {
  FaceParams,
  AvatarData,
  AvatarConfig,
  AvatarLayer,
  AnimationRule,
  FaceTrackerOptions,
  AvatarRendererOptions,
} from './types';
export { landmarksToFaceParams, normalizeFaceParams } from './utils';


