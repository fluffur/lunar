import { useState, useRef } from 'react';
import { Button, FileButton, Stack, Text as MantineText, Paper, Group } from '@mantine/core';
import type { AvatarConfig } from './types';
import { createCustomAvatarConfig } from './avatarConfigs';

interface AvatarUploadProps {
  onAvatarCreated: (config: AvatarConfig) => void;
  onCancel: () => void;
}

export function AvatarUpload({ onAvatarCreated, onCancel }: AvatarUploadProps) {
  const [headImage, setHeadImage] = useState<string | null>(null);
  const [leftEyeImage, setLeftEyeImage] = useState<string | null>(null);
  const [rightEyeImage, setRightEyeImage] = useState<string | null>(null);
  const [mouthImage, setMouthImage] = useState<string | null>(null);
  const [avatarName, setAvatarName] = useState('');
  const headFileRef = useRef<() => void>(null);
  const leftEyeFileRef = useRef<() => void>(null);
  const rightEyeFileRef = useRef<() => void>(null);
  const mouthFileRef = useRef<() => void>(null);

  const handleFileSelect = async (
    file: File | null,
    setter: (url: string) => void
  ) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large (max 2MB). Please resize the image.');
      return;
    }

    try {
      const resized = await resizeImage(file, 512, 512);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setter(result);
        }
      };
      reader.readAsDataURL(resized);
    } catch (error) {
      console.error('Failed to process image:', error);
      alert('Failed to process image. Please try another file.');
    }
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          0.9
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCreate = () => {
    if (!avatarName.trim()) {
      alert('Please enter an avatar name');
      return;
    }

    if (!headImage) {
      alert('Please upload a head image');
      return;
    }

    const layers: AvatarConfig['layers'] = [
      {
        id: 'head',
        type: 'head',
        imageUrl: headImage,
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
    ];

    if (leftEyeImage) {
      layers.push({
        id: 'leftEye',
        type: 'eye',
        imageUrl: leftEyeImage,
        position: { x: -50, y: -30 },
        size: { width: 30, height: 30 },
        animationRules: [
          {
            param: 'leftEyeBlink',
            transform: 'scale',
            mapping: (value) => -value * 0.9,
          },
        ],
      });
    }

    if (rightEyeImage) {
      layers.push({
        id: 'rightEye',
        type: 'eye',
        imageUrl: rightEyeImage,
        position: { x: 50, y: -30 },
        size: { width: 30, height: 30 },
        animationRules: [
          {
            param: 'rightEyeBlink',
            transform: 'scale',
            mapping: (value) => -value * 0.9,
          },
        ],
      });
    }

    if (mouthImage) {
      layers.push({
        id: 'mouth',
        type: 'mouth',
        imageUrl: mouthImage,
        position: { x: 0, y: 50 },
        size: { width: 60, height: 30 },
        animationRules: [
          {
            param: 'mouthOpen',
            transform: 'scale',
            mapping: (value) => value * 0.5,
          },
        ],
      });
    }

    const config = createCustomAvatarConfig(
      `custom-${Date.now()}`,
      avatarName,
      layers
    );

    onAvatarCreated(config);
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <MantineText fw={500}>Create Custom Avatar</MantineText>

        <MantineText size="sm">Avatar Name:</MantineText>
        <input
          type="text"
          value={avatarName}
          onChange={(e) => setAvatarName(e.target.value)}
          placeholder="My Avatar"
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />

        <Stack gap="xs">
          <MantineText size="sm">Head Image (required):</MantineText>
          {headImage && (
            <img
              src={headImage}
              alt="Head"
              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
            />
          )}
          <FileButton
            onChange={(file) => handleFileSelect(file, setHeadImage)}
            accept="image/png,image/jpeg,image/svg+xml"
          >
            {(props) => (
              <Button {...props} size="sm">
                {headImage ? 'Change Head' : 'Upload Head'}
              </Button>
            )}
          </FileButton>
        </Stack>

        <Stack gap="xs">
          <MantineText size="sm">Left Eye (optional):</MantineText>
          {leftEyeImage && (
            <img
              src={leftEyeImage}
              alt="Left Eye"
              style={{ width: '50px', height: '50px', objectFit: 'contain' }}
            />
          )}
          <FileButton
            onChange={(file) => handleFileSelect(file, setLeftEyeImage)}
            accept="image/png,image/jpeg,image/svg+xml"
          >
            {(props) => (
              <Button {...props} size="sm" variant="light">
                {leftEyeImage ? 'Change Left Eye' : 'Upload Left Eye'}
              </Button>
            )}
          </FileButton>
        </Stack>

        <Stack gap="xs">
          <MantineText size="sm">Right Eye (optional):</MantineText>
          {rightEyeImage && (
            <img
              src={rightEyeImage}
              alt="Right Eye"
              style={{ width: '50px', height: '50px', objectFit: 'contain' }}
            />
          )}
          <FileButton
            onChange={(file) => handleFileSelect(file, setRightEyeImage)}
            accept="image/png,image/jpeg,image/svg+xml"
          >
            {(props) => (
              <Button {...props} size="sm" variant="light">
                {rightEyeImage ? 'Change Right Eye' : 'Upload Right Eye'}
              </Button>
            )}
          </FileButton>
        </Stack>

        <Stack gap="xs">
          <MantineText size="sm">Mouth (optional):</MantineText>
          {mouthImage && (
            <img
              src={mouthImage}
              alt="Mouth"
              style={{ width: '50px', height: '50px', objectFit: 'contain' }}
            />
          )}
          <FileButton
            onChange={(file) => handleFileSelect(file, setMouthImage)}
            accept="image/png,image/jpeg,image/svg+xml"
          >
            {(props) => (
              <Button {...props} size="sm" variant="light">
                {mouthImage ? 'Change Mouth' : 'Upload Mouth'}
              </Button>
            )}
          </FileButton>
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create Avatar</Button>
        </Group>
      </Stack>
    </Paper>
  );
}

