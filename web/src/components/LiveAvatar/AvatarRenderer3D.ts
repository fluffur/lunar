import * as THREE from 'three';
import { VRM, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { FaceParams } from './types';

export class AvatarRenderer3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private vrm: VRM | null = null;
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private animationFrameId: number | null = null;
  private isModelLoaded = false;
  private lastParams: FaceParams | null = null;
  private smoothParams: FaceParams | null = null;
  private visibilityHandler: (() => void) | null = null;
  private isTabVisible = true;
  private backgroundRenderInterval: NodeJS.Timeout | null = null;
  private lastDrawParams: FaceParams | null = null;
  private blinkExpressionKey: string | null = null;
  private mouthExpressionKey: string | null = null;
  private smileExpressionKey: string | null = null;
  private blinkExpressionName: string | null = null;
  private mouthExpressionName: string | null = null;
  private smileExpressionName: string | null = null;

  constructor(canvas: HTMLCanvasElement, width = 640, height = 480) {
    this.width = width;
    this.height = height;

    const webglCanvas = document.createElement('canvas');
    webglCanvas.width = width;
    webglCanvas.height = height;
    webglCanvas.style.position = 'absolute';
    webglCanvas.style.left = '-9999px';
    webglCanvas.style.top = '-9999px';
    webglCanvas.style.width = `${width}px`;
    webglCanvas.style.height = `${height}px`;
    document.body.appendChild(webglCanvas);

    this.canvas = webglCanvas;

    const gl = webglCanvas.getContext('webgl2', { 
      preserveDrawingBuffer: true,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    }) || webglCanvas.getContext('webgl', { 
      preserveDrawingBuffer: true,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    }) || webglCanvas.getContext('experimental-webgl', { 
      preserveDrawingBuffer: true,
      antialias: true,
      alpha: false
    });
    if (!gl) {
      document.body.removeChild(webglCanvas);
      throw new Error('WebGL is not supported in this browser. 3D avatars require WebGL support.');
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(0, 1.4, 0.8);
    this.camera.lookAt(0, 1.4, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
      context: gl as WebGLRenderingContext,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    this.setupVisibilityHandling();
    this.render();
  }

  private setupVisibilityHandling(): void {
    this.isTabVisible = document.visibilityState === 'visible';
    
    this.visibilityHandler = () => {
      this.isTabVisible = document.visibilityState === 'visible';
      
      if (!this.isTabVisible && this.lastDrawParams) {
        this.startBackgroundRendering();
      } else {
        this.stopBackgroundRendering();
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private startBackgroundRendering(): void {
    if (this.backgroundRenderInterval) return;
    
    this.backgroundRenderInterval = setInterval(() => {
      if (!this.isTabVisible && this.lastDrawParams && this.isModelLoaded) {
        this.applyFaceParams(this.lastDrawParams);
        if (this.vrm) {
          this.vrm.update(1 / 60);
        }
        this.render();
      } else if (this.isTabVisible) {
        this.stopBackgroundRendering();
      }
    }, 33);
  }

  private stopBackgroundRendering(): void {
    if (this.backgroundRenderInterval) {
      clearInterval(this.backgroundRenderInterval);
      this.backgroundRenderInterval = null;
    }
  }

  async loadModel(url: string): Promise<void> {
    try {
      const loader = new GLTFLoader();
      loader.register((parser) => new VRMLoaderPlugin(parser));

      const gltf = await loader.loadAsync(url);
      const vrm = gltf.userData.vrm as VRM;
      if (!vrm) {
        throw new Error('VRM data not found in GLTF');
      }

      VRMUtils.removeUnnecessaryVertices(vrm.scene);
      if (VRMUtils.combineSkeletons) {
        VRMUtils.combineSkeletons(vrm.scene);
      } else {
        VRMUtils.removeUnnecessaryJoints(vrm.scene);
      }

      vrm.scene.position.set(0, 0, 0);
      this.scene.add(vrm.scene);

      this.vrm = vrm;
      this.isModelLoaded = true;

      if (vrm.expressionManager) {
        this.findExpressionKeys(vrm.expressionManager);
      }

      vrm.scene.rotation.y = Math.PI;

      if (vrm.humanoid) {
        const headBone = vrm.humanoid.getNormalizedBoneNode('head');
        if (headBone) {
          const headWorldPos = new THREE.Vector3();
          headBone.getWorldPosition(headWorldPos);
          
          this.camera.position.set(headWorldPos.x, headWorldPos.y + 0.15, headWorldPos.z + 0.4);
          this.camera.lookAt(headWorldPos.x, headWorldPos.y, headWorldPos.z);
        } else {
          const box = new THREE.Box3().setFromObject(vrm.scene);
          const center = box.getCenter(new THREE.Vector3());
          this.camera.position.set(center.x, center.y + 0.3, center.z + 0.5);
          this.camera.lookAt(center.x, center.y, center.z);
        }
      } else {
        this.camera.position.set(0, 1.6, 0.5);
        this.camera.lookAt(0, 1.4, 0);
      }

      this.render();
    } catch (error) {
      console.error('[AvatarRenderer3D] Failed to load VRM model:', error);
      throw error;
    }
  }

  private findExpressionKeys(manager: any): void {
    const expressions = manager.expressions;
    for (const [key, expr] of Object.entries(expressions)) {
      const name = (expr as any)?.expressionName || '';
      
        if (!this.blinkExpressionKey && (
          name === 'blink' || 
          name === 'blinkLeft' || 
          name === 'blinkRight'
        )) {
          this.blinkExpressionKey = key;
          this.blinkExpressionName = name;
        }
        
        if (!this.mouthExpressionKey && (
          name === 'aa' || 
          name === 'ih' || 
          name === 'ou' || 
          name === 'ee' ||
          name === 'oh'
        )) {
          this.mouthExpressionKey = key;
          this.mouthExpressionName = name;
        }
        
        if (!this.smileExpressionKey && (
          name === 'happy' || 
          name === 'smile' || 
          name === 'joy'
        )) {
          this.smileExpressionKey = key;
          this.smileExpressionName = name;
        }
    }
    
  }

  private applyFaceParams(params: FaceParams): void {
    if (!this.vrm || !this.isModelLoaded) return;

    if (this.vrm.humanoid) {
      const headBone = this.vrm.humanoid.getNormalizedBoneNode('head');
      if (headBone) {
        headBone.rotation.x = THREE.MathUtils.degToRad(params.rotationX);
        headBone.rotation.y = THREE.MathUtils.degToRad(params.rotationY);
        headBone.rotation.z = THREE.MathUtils.degToRad(params.rotationZ);
      }
    }

    if (this.vrm.expressionManager) {
      const blinkValue = Math.max(params.leftEyeBlink, params.rightEyeBlink);
      const mouthValue = params.mouthOpen;
      const smileValue = params.smile;
      
      const blinkAmplified = Math.min(1, blinkValue * 25);
      const mouthAmplified = Math.min(1, mouthValue * 12);
      const smileAmplified = Math.min(1, smileValue * 8);
      
      const blinkFinal = Math.min(1, Math.max(0, blinkAmplified));
      const mouthFinal = Math.min(1, Math.max(0, mouthAmplified));
      const smileFinal = Math.min(1, Math.max(0, smileAmplified));
      
      if (this.blinkExpressionKey && this.blinkExpressionName) {
        try {
          const expressionName = this.blinkExpressionName;
          const key = this.blinkExpressionKey;
          
          try {
            this.vrm.expressionManager.setValue(expressionName, blinkFinal);
          } catch (nameError) {
            this.vrm.expressionManager.setValue(key, blinkFinal);
          }
        } catch (e) {
          console.error('[AvatarRenderer3D] Error setting blink:', e);
        }
      }
      
      if (this.mouthExpressionKey && this.mouthExpressionName) {
        try {
          const expressionName = this.mouthExpressionName;
          const key = this.mouthExpressionKey;
          
          try {
            this.vrm.expressionManager.setValue(expressionName, mouthFinal);
          } catch (nameError) {
            this.vrm.expressionManager.setValue(key, mouthFinal);
          }
        } catch (e) {
          console.error('[AvatarRenderer3D] Error setting mouth:', e);
        }
      }
      
      if (this.smileExpressionKey && this.smileExpressionName) {
        try {
          const expressionName = this.smileExpressionName;
          const key = this.smileExpressionKey;
          
          try {
            this.vrm.expressionManager.setValue(expressionName, smileFinal);
          } catch (nameError) {
            this.vrm.expressionManager.setValue(key, smileFinal);
          }
        } catch (e) {
          console.error('[AvatarRenderer3D] Error setting smile:', e);
        }
      }
    }
  }

  private smoothTransition(current: FaceParams | null, target: FaceParams, factor = 0.3): FaceParams {
    if (!this.smoothParams || !current) {
      this.smoothParams = { ...target };
      return target;
    }

    return {
      rotationX: this.smoothParams.rotationX + (target.rotationX - this.smoothParams.rotationX) * factor,
      rotationY: this.smoothParams.rotationY + (target.rotationY - this.smoothParams.rotationY) * factor,
      rotationZ: this.smoothParams.rotationZ + (target.rotationZ - this.smoothParams.rotationZ) * factor,
      leftEyeBlink: this.smoothParams.leftEyeBlink + (target.leftEyeBlink - this.smoothParams.leftEyeBlink) * factor,
      rightEyeBlink: this.smoothParams.rightEyeBlink + (target.rightEyeBlink - this.smoothParams.rightEyeBlink) * factor,
      mouthOpen: this.smoothParams.mouthOpen + (target.mouthOpen - this.smoothParams.mouthOpen) * factor,
      smile: this.smoothParams.smile + (target.smile - this.smoothParams.smile) * factor,
    };
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  draw(params: FaceParams | null): void {
    if (!params) {
      if (this.lastParams) {
        const neutralParams: FaceParams = {
          rotationX: 0,
          rotationY: 0,
          rotationZ: 0,
          leftEyeBlink: 0,
          rightEyeBlink: 0,
          mouthOpen: 0,
          smile: 0,
        };
        this.smoothParams = this.smoothTransition(this.lastParams, neutralParams, 0.1);
        this.lastDrawParams = this.smoothParams;
        this.applyFaceParams(this.smoothParams);
        if (this.vrm) {
          this.vrm.update(1 / 60);
        }
        this.render();
      }
      return;
    }

    this.smoothParams = this.smoothTransition(this.lastParams, params);
    this.lastParams = params;
    this.lastDrawParams = this.smoothParams;

    this.applyFaceParams(this.smoothParams);

    if (this.vrm) {
      this.vrm.update(1 / 60);
    }

    this.render();
  }

  async updateModel(url: string): Promise<void> {
    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
      this.scene.remove(this.vrm.scene);
      this.vrm = null;
      this.isModelLoaded = false;
    }
    await this.loadModel(url);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getStream(fps = 30): MediaStream {
    return this.canvas.captureStream(fps);
  }

  dispose(): void {
    this.stopBackgroundRendering();

    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
      this.scene.remove(this.vrm.scene);
      this.vrm = null;
    }

    this.scene.clear();
    this.renderer.dispose();

    if (this.canvas.parentElement && this.canvas.parentElement === document.body) {
      document.body.removeChild(this.canvas);
    }

    this.isModelLoaded = false;
    this.lastParams = null;
    this.smoothParams = null;
    this.lastDrawParams = null;
    this.blinkExpressionKey = null;
    this.mouthExpressionKey = null;
    this.smileExpressionKey = null;
    this.blinkExpressionName = null;
    this.mouthExpressionName = null;
    this.smileExpressionName = null;
  }
}

