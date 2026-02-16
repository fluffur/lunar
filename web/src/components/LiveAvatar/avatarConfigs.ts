import type { AvatarConfig } from './types';

export const defaultAvatarConfigs: Record<string, AvatarConfig> = {
  human: {
    id: 'human',
    name: 'Human',
    type: 'default',
    modelType: '2d',
    layers: [
      {
        id: 'head',
        type: 'head',
        color: '#ffd1a9',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 },
        animationRules: [
          {
            param: 'rotationX',
            transform: 'rotation',
            mapping: (value) => value * 0.5,
          },
          {
            param: 'rotationY',
            transform: 'position',
            mapping: (value) => value * 10,
          },
        ],
      },
      {
        id: 'leftEye',
        type: 'eye',
        color: '#4a4a4a',
        position: { x: -50, y: -30 },
        size: { width: 30, height: 30 },
        animationRules: [
          {
            param: 'leftEyeBlink',
            transform: 'scale',
            mapping: (value) => -value * 0.9,
          },
        ],
      },
      {
        id: 'rightEye',
        type: 'eye',
        color: '#4a4a4a',
        position: { x: 50, y: -30 },
        size: { width: 30, height: 30 },
        animationRules: [
          {
            param: 'rightEyeBlink',
            transform: 'scale',
            mapping: (value) => -value * 0.9,
          },
        ],
      },
      {
        id: 'mouth',
        type: 'mouth',
        color: '#8b4513',
        position: { x: 0, y: 50 },
        size: { width: 60, height: 30 },
        animationRules: [
          {
            param: 'mouthOpen',
            transform: 'scale',
            mapping: (value) => value * 0.5,
          },
          {
            param: 'smile',
            transform: 'rotation',
            mapping: (value) => value * 10,
          },
        ],
      },
    ],
  },
  cat: {
    id: 'cat',
    name: 'Cat',
    type: 'default',
    modelType: '2d',
    layers: [
      {
        id: 'head',
        type: 'head',
        color: '#ff8c00',
        position: { x: 0, y: 0 },
        size: { width: 220, height: 260 },
        animationRules: [
          {
            param: 'rotationX',
            transform: 'rotation',
            mapping: (value) => value * 0.5,
          },
          {
            param: 'rotationY',
            transform: 'position',
            mapping: (value) => value * 10,
          },
        ],
      },
      {
        id: 'leftEye',
        type: 'eye',
        color: '#228b22',
        position: { x: -55, y: -40 },
        size: { width: 35, height: 25 },
        animationRules: [
          {
            param: 'leftEyeBlink',
            transform: 'scale',
            mapping: (value) => -value * 0.9,
          },
        ],
      },
      {
        id: 'rightEye',
        type: 'eye',
        color: '#228b22',
        position: { x: 55, y: -40 },
        size: { width: 35, height: 25 },
        animationRules: [
          {
            param: 'rightEyeBlink',
            transform: 'scale',
            mapping: (value) => -value * 0.9,
          },
        ],
      },
      {
        id: 'mouth',
        type: 'mouth',
        color: '#654321',
        position: { x: 0, y: 60 },
        size: { width: 40, height: 20 },
      },
    ],
  },
  robot: {
    id: 'robot',
    name: 'Robot',
    type: 'default',
    modelType: '2d',
    layers: [
      {
        id: 'head',
        type: 'head',
        color: '#a0a0a0',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 },
        animationRules: [
          {
            param: 'rotationX',
            transform: 'rotation',
            mapping: (value) => value * 0.5,
          },
          {
            param: 'rotationY',
            transform: 'position',
            mapping: (value) => value * 10,
          },
        ],
      },
      {
        id: 'leftEye',
        type: 'eye',
        color: '#00d4ff',
        position: { x: -50, y: -30 },
        size: { width: 35, height: 35 },
        animationRules: [
          {
            param: 'leftEyeBlink',
            transform: 'opacity',
            mapping: (value) => 1 - value,
          },
        ],
      },
      {
        id: 'rightEye',
        type: 'eye',
        color: '#00d4ff',
        position: { x: 50, y: -30 },
        size: { width: 35, height: 35 },
        animationRules: [
          {
            param: 'rightEyeBlink',
            transform: 'opacity',
            mapping: (value) => 1 - value,
          },
        ],
      },
      {
        id: 'mouth',
        type: 'mouth',
        color: '#404040',
        position: { x: 0, y: 50 },
        size: { width: 50, height: 20 },
        animationRules: [
          {
            param: 'mouthOpen',
            transform: 'scale',
            mapping: (value) => value * 0.3,
          },
        ],
      },
    ],
  },
  // 3D VRM Models
  anime1: {
    id: 'anime1',
    name: 'Anime Character 1',
    type: 'vrm',
    modelType: 'vrm',
    modelUrl: '/models/7903223404901736379.glb',
  },
  anime2: {
    id: 'anime2',
    name: 'Anime Character 2',
    type: 'vrm',
    modelType: 'vrm',
    modelUrl: '/models/model2.vrm',
  },
  anime3: {
    id: 'anime3',
    name: 'Anime Character 3',
    type: 'vrm',
    modelType: 'vrm',
    modelUrl: '/models/model3.vrm',
  },
};

export function createCustomAvatarConfig(
  id: string,
  name: string,
  layers: AvatarConfig['layers']
): AvatarConfig {
  return {
    id,
    name,
    type: 'custom',
    modelType: '2d',
    layers,
  };
}

export function loadAvatarConfigFromJSON(json: string): AvatarConfig {
  try {
    const config = JSON.parse(json) as AvatarConfig;
    if (!config.id || !config.name || !config.layers) {
      throw new Error('Invalid avatar config format');
    }
    return config;
  } catch (error) {
    throw new Error(`Failed to parse avatar config: ${error}`);
  }
}


