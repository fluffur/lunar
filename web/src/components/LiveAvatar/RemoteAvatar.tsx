import { useEffect, useRef } from 'react';
import { AvatarRenderer } from './AvatarRenderer';
import { AvatarRenderer3D } from './AvatarRenderer3D';
import type { AvatarConfig, FaceParams } from './types';

interface RemoteAvatarProps {
  avatarConfig: AvatarConfig;
  faceParams: FaceParams;
  width?: number;
  height?: number;
}

export function RemoteAvatar({
  avatarConfig,
  faceParams,
  width = 640,
  height = 480,
}: RemoteAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderer2DRef = useRef<AvatarRenderer | null>(null);
  const renderer3DRef = useRef<AvatarRenderer3D | null>(null);
  const is3DRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const is3D = avatarConfig.modelType === 'vrm' && avatarConfig.modelUrl;

    if (is3D !== is3DRef.current) {
      if (is3D) {
        if (renderer2DRef.current) {
          renderer2DRef.current = null;
        }
        if (!renderer3DRef.current && containerRef.current) {
          const container = containerRef.current;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          renderer3DRef.current = new AvatarRenderer3D(tempCanvas, width, height);
          const webglCanvas = (renderer3DRef.current as any).canvas;
          if (webglCanvas && container) {
            webglCanvas.style.position = 'absolute';
            webglCanvas.style.left = '0';
            webglCanvas.style.top = '0';
            webglCanvas.style.width = '100%';
            webglCanvas.style.height = '100%';
            container.appendChild(webglCanvas);
          }
          renderer3DRef.current.loadModel(avatarConfig.modelUrl!).catch((error) => {
            console.error('[RemoteAvatar] Failed to load 3D model:', error);
            renderer3DRef.current = null;
          });
        } else if (avatarConfig.modelUrl && renderer3DRef.current) {
          renderer3DRef.current.loadModel(avatarConfig.modelUrl).catch((error) => {
            console.error('[RemoteAvatar] Failed to reload 3D model:', error);
          });
        }
      } else {
        if (renderer3DRef.current) {
          renderer3DRef.current.dispose();
          renderer3DRef.current = null;
        }
        if (!renderer2DRef.current) {
          renderer2DRef.current = new AvatarRenderer(canvas, avatarConfig, width, height);
        } else {
          renderer2DRef.current.updateConfig(avatarConfig);
        }
      }
      is3DRef.current = is3D;
    } else if (!is3D && renderer2DRef.current) {
      renderer2DRef.current.updateConfig(avatarConfig);
    }

    if (is3D && renderer3DRef.current && faceParams) {
      renderer3DRef.current.draw(faceParams);
    } else if (!is3D && renderer2DRef.current && faceParams) {
      renderer2DRef.current.draw(faceParams);
    }
  }, [avatarConfig, faceParams, width, height]);

  useEffect(() => {
    return () => {
      if (renderer3DRef.current) {
        renderer3DRef.current.dispose();
      }
    };
  }, []);

  const is3D = avatarConfig.modelType === 'vrm' && avatarConfig.modelUrl;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!is3D && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  );
}


