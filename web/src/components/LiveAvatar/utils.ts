import type { FaceParams } from './types';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

const LANDMARK_INDICES = {
  LEFT_EYE_TOP: 159,
  LEFT_EYE_BOTTOM: 145,
  LEFT_EYE_LEFT: 33,
  LEFT_EYE_RIGHT: 133,
  RIGHT_EYE_TOP: 386,
  RIGHT_EYE_BOTTOM: 374,
  RIGHT_EYE_LEFT: 362,
  RIGHT_EYE_RIGHT: 263,
  MOUTH_TOP: 13,
  MOUTH_BOTTOM: 14,
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  NOSE_TIP: 1,
  FOREHEAD: 10,
  CHIN: 175,
  LEFT_FACE: 234,
  RIGHT_FACE: 454,
};

function calculateEyeAspectRatio(
  top: Landmark,
  bottom: Landmark,
  left: Landmark,
  right: Landmark
): number {
  const verticalDist = Math.abs(top.y - bottom.y);
  const horizontalDist = Math.abs(right.x - left.x);
  
  
  if (horizontalDist === 0) return 0;
  return verticalDist / horizontalDist;
}

function calculate3DRotation(
  landmarks: Landmark[]
): { x: number; y: number; z: number } {
  const noseTip = landmarks[LANDMARK_INDICES.NOSE_TIP];
  const forehead = landmarks[LANDMARK_INDICES.FOREHEAD];
  const chin = landmarks[LANDMARK_INDICES.CHIN];
  const leftFace = landmarks[LANDMARK_INDICES.LEFT_FACE];
  const rightFace = landmarks[LANDMARK_INDICES.RIGHT_FACE];
  const leftEye = {
    x: (landmarks[LANDMARK_INDICES.LEFT_EYE_LEFT].x + landmarks[LANDMARK_INDICES.LEFT_EYE_RIGHT].x) / 2,
    y: (landmarks[LANDMARK_INDICES.LEFT_EYE_TOP].y + landmarks[LANDMARK_INDICES.LEFT_EYE_BOTTOM].y) / 2,
    z: (landmarks[LANDMARK_INDICES.LEFT_EYE_LEFT].z + landmarks[LANDMARK_INDICES.LEFT_EYE_RIGHT].z) / 2,
  };
  const rightEye = {
    x: (landmarks[LANDMARK_INDICES.RIGHT_EYE_LEFT].x + landmarks[LANDMARK_INDICES.RIGHT_EYE_RIGHT].x) / 2,
    y: (landmarks[LANDMARK_INDICES.RIGHT_EYE_TOP].y + landmarks[LANDMARK_INDICES.RIGHT_EYE_BOTTOM].y) / 2,
    z: (landmarks[LANDMARK_INDICES.RIGHT_EYE_LEFT].z + landmarks[LANDMARK_INDICES.RIGHT_EYE_RIGHT].z) / 2,
  };

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const faceCenterX = (leftFace.x + rightFace.x) / 2;
  const faceCenterY = (forehead.y + chin.y) / 2;

  const yaw = ((eyeCenterX - faceCenterX) / 0.3) * 45;
  const pitch = ((eyeCenterY - faceCenterY) / 0.3) * 45;

  const eyeDiffY = rightEye.y - leftEye.y;
  const eyeDiffX = rightEye.x - leftEye.x;
  const roll = Math.atan2(eyeDiffY, eyeDiffX) * (180 / Math.PI);

  return {
    x: Math.max(-45, Math.min(45, pitch)),
    y: Math.max(-45, Math.min(45, yaw)),
    z: Math.max(-30, Math.min(30, roll)),
  };
}

function calculateMouthOpen(landmarks: Landmark[]): number {
  const mouthTop = landmarks[LANDMARK_INDICES.MOUTH_TOP];
  const mouthBottom = landmarks[LANDMARK_INDICES.MOUTH_BOTTOM];
  const mouthLeft = landmarks[LANDMARK_INDICES.MOUTH_LEFT];
  const mouthRight = landmarks[LANDMARK_INDICES.MOUTH_RIGHT];

  const verticalDist = Math.abs(mouthTop.y - mouthBottom.y);
  const horizontalDist = Math.abs(mouthRight.x - mouthLeft.x);
  
  
  if (horizontalDist === 0) return 0;

  const aspectRatio = verticalDist / horizontalDist;
  const baseRatio = 0.08;
  const normalized = (aspectRatio - baseRatio) / 0.12;
  const result = Math.max(0, Math.min(1, normalized));
  
  
  return result;
}

function calculateSmile(landmarks: Landmark[]): number {
  const mouthLeft = landmarks[LANDMARK_INDICES.MOUTH_LEFT];
  const mouthRight = landmarks[LANDMARK_INDICES.MOUTH_RIGHT];
  const mouthTop = landmarks[LANDMARK_INDICES.MOUTH_TOP];
  const mouthBottom = landmarks[LANDMARK_INDICES.MOUTH_BOTTOM];

  const mouthCenterY = (mouthTop.y + mouthBottom.y) / 2;
  const mouthLeftY = mouthLeft.y;
  const mouthRightY = mouthRight.y;

  const leftCurve = mouthLeftY - mouthCenterY;
  const rightCurve = mouthRightY - mouthCenterY;

  const smileValue = (leftCurve + rightCurve) / 2;
  // Улыбка: когда уголки рта поднимаются выше центра, smileValue становится положительным
  // Нормализуем: если smileValue > 0.005, это улыбка
  const normalized = Math.max(0, smileValue * 100);
  const result = Math.min(1, normalized);
  
  
  return result;
}

export function landmarksToFaceParams(landmarks: Landmark[]): FaceParams {
  const leftEyeAspectRatio = calculateEyeAspectRatio(
    landmarks[LANDMARK_INDICES.LEFT_EYE_TOP],
    landmarks[LANDMARK_INDICES.LEFT_EYE_BOTTOM],
    landmarks[LANDMARK_INDICES.LEFT_EYE_LEFT],
    landmarks[LANDMARK_INDICES.LEFT_EYE_RIGHT]
  );
  
  const rightEyeAspectRatio = calculateEyeAspectRatio(
    landmarks[LANDMARK_INDICES.RIGHT_EYE_TOP],
    landmarks[LANDMARK_INDICES.RIGHT_EYE_BOTTOM],
    landmarks[LANDMARK_INDICES.RIGHT_EYE_LEFT],
    landmarks[LANDMARK_INDICES.RIGHT_EYE_RIGHT]
  );

  const leftEyeBlink = Math.max(0, Math.min(1, (0.22 - leftEyeAspectRatio) / 0.12));
  const rightEyeBlink = Math.max(0, Math.min(1, (0.22 - rightEyeAspectRatio) / 0.12));

  const rotation = calculate3DRotation(landmarks);
  const mouthOpen = calculateMouthOpen(landmarks);
  const smile = calculateSmile(landmarks);

  return {
    rotationX: rotation.x,
    rotationY: rotation.y,
    rotationZ: rotation.z,
    leftEyeBlink: leftEyeBlink,
    rightEyeBlink: rightEyeBlink,
    mouthOpen: Math.max(0, Math.min(1, mouthOpen)),
    smile: Math.max(0, Math.min(1, smile)),
  };
}

export function normalizeFaceParams(params: FaceParams): FaceParams {
  return {
    rotationX: Math.max(-45, Math.min(45, params.rotationX)),
    rotationY: Math.max(-45, Math.min(45, params.rotationY)),
    rotationZ: Math.max(-30, Math.min(30, params.rotationZ)),
    leftEyeBlink: Math.max(0, Math.min(1, params.leftEyeBlink)),
    rightEyeBlink: Math.max(0, Math.min(1, params.rightEyeBlink)),
    mouthOpen: Math.max(0, Math.min(1, params.mouthOpen)),
    smile: Math.max(0, Math.min(1, params.smile)),
  };
}

