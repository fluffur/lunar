import type { FaceParams, AvatarConfig, AvatarLayer } from './types';

export class AvatarRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: AvatarConfig;
  private width: number;
  private height: number;
  private layerImages: Map<string, HTMLImageElement> = new Map();
  private imagesLoaded = false;
  private lastParams: FaceParams | null = null;
  private smoothParams: FaceParams | null = null;

  constructor(canvas: HTMLCanvasElement, config: AvatarConfig, width = 640, height = 480) {
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    this.ctx = ctx;
    this.config = config;
    this.width = width;
    this.height = height;
    this.loadLayerImages();
  }

  private async loadLayerImages(): Promise<void> {
    const loadPromises = this.config.layers
      .filter((layer) => layer.imageUrl)
      .map((layer) => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            this.layerImages.set(layer.id, img);
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load image for layer ${layer.id}: ${layer.imageUrl}`);
            resolve();
          };
          img.src = layer.imageUrl!;
        });
      });

    try {
      await Promise.all(loadPromises);
      this.imagesLoaded = true;
    } catch (error) {
      console.error('Failed to load avatar images:', error);
      this.imagesLoaded = true;
    }
  }

  updateConfig(config: AvatarConfig): void {
    this.config = config;
    this.layerImages.clear();
    this.loadLayerImages();
  }


  private drawLayer(
    layer: AvatarLayer,
    params: FaceParams,
    centerX: number,
    centerY: number
  ): void {
    this.ctx.save();

    let x = layer.position.x;
    let y = layer.position.y;
    let scaleX = layer.size.width;
    let scaleY = layer.size.height;
    let rotation = 0;
    let opacity = 1;

    if (layer.animationRules) {
      for (const rule of layer.animationRules) {
        const value = params[rule.param];
        const mappedValue = rule.mapping(value);

        switch (rule.transform) {
          case 'rotation':
            rotation += mappedValue;
            break;
          case 'scale':
            const scaleFactor = 1 + mappedValue;
            scaleX *= scaleFactor;
            scaleY *= scaleFactor;
            break;
          case 'opacity':
            opacity = Math.max(0, Math.min(1, mappedValue));
            break;
          case 'position':
            if (rule.param === 'rotationY') {
              x += mappedValue;
            } else if (rule.param === 'rotationX') {
              y += mappedValue;
            } else {
              x += mappedValue;
              y += mappedValue;
            }
            break;
        }
      }
    }

    this.ctx.globalAlpha = opacity;
    this.ctx.translate(x, y);
    this.ctx.rotate((rotation * Math.PI) / 180);

    if (layer.imageUrl && this.imagesLoaded) {
      const img = this.layerImages.get(layer.id);
      if (img) {
        this.ctx.drawImage(
          img,
          -scaleX / 2,
          -scaleY / 2,
          scaleX,
          scaleY
        );
      }
    } else if (layer.color) {
      this.drawDefaultLayer(layer, scaleX, scaleY);
    }

    this.ctx.restore();
  }

  private drawDefaultLayer(layer: AvatarLayer, width: number, height: number): void {
    this.ctx.fillStyle = layer.color || '#ffffff';
    this.ctx.strokeStyle = layer.color || '#ffffff';

    switch (layer.type) {
      case 'head':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'eye':
        const eyeHeight = height * 0.8;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width / 2, eyeHeight / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case 'mouth':
        if (layer.id.includes('smile')) {
          const smileCurve = 0.3;
          this.ctx.lineWidth = 4;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, width / 2, 0.2, Math.PI - 0.2);
          this.ctx.stroke();
        } else {
          const mouthHeight = height * 0.3;
          this.ctx.beginPath();
          this.ctx.ellipse(0, 0, width / 2, mouthHeight / 2, 0, 0, Math.PI * 2);
          this.ctx.fill();
        }
        break;

      default:
        this.ctx.fillRect(-width / 2, -height / 2, width, height);
        break;
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getStream(fps = 30): MediaStream {
    return this.canvas.captureStream(fps);
  }

  dispose(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.layerImages.forEach((img) => {
      img.src = '';
    });
    this.layerImages.clear();
    this.lastParams = null;
    this.smoothParams = null;
  }

  private smoothTransition(current: FaceParams, target: FaceParams, factor = 0.3): FaceParams {
    if (!this.smoothParams) {
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

  draw(params: FaceParams): void {
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
        this.render(this.smoothParams);
      }
      return;
    }

    this.smoothParams = this.smoothTransition(this.lastParams || params, params);
    this.lastParams = params;
    this.render(this.smoothParams);
  }

  private render(params: FaceParams): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate((params.rotationZ * Math.PI) / 180);

    for (const layer of this.config.layers) {
      this.drawLayer(layer, params, centerX, centerY);
    }

    this.ctx.restore();
  }
}

