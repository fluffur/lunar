import { useState } from 'react';
import { Button, Group, Paper, Stack, Text as MantineText, Modal } from '@mantine/core';
import type { AvatarConfig } from './types';
import { defaultAvatarConfigs } from './avatarConfigs';
import { AvatarUpload } from './AvatarUpload';

interface AvatarSelectorProps {
  selectedAvatar: AvatarConfig | null;
  onAvatarSelect: (config: AvatarConfig) => void;
  customAvatars?: AvatarConfig[];
  onCustomAvatarCreated?: (config: AvatarConfig) => void;
}

export function AvatarSelector({
  selectedAvatar,
  onAvatarSelect,
  customAvatars = [],
  onCustomAvatarCreated,
}: AvatarSelectorProps) {
  const [uploadModalOpened, setUploadModalOpened] = useState(false);

  const handleCustomAvatarCreated = (config: AvatarConfig) => {
    onAvatarSelect(config);
    onCustomAvatarCreated?.(config);
    setUploadModalOpened(false);
  };

  // Разделяем аватары на 2D и 3D
  const avatars2D = Object.values(defaultAvatarConfigs).filter(
    (config) => (config.modelType || '2d') === '2d'
  );
  const avatars3D = Object.values(defaultAvatarConfigs).filter(
    (config) => config.modelType === 'vrm'
  );

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <MantineText fw={500}>Select Avatar</MantineText>

        {avatars2D.length > 0 && (
          <Stack gap="xs">
            <MantineText size="sm" fw={500}>
              2D Avatars:
            </MantineText>
            <Group gap="xs">
              {avatars2D.map((config) => (
                <Button
                  key={config.id}
                  variant={selectedAvatar?.id === config.id ? 'filled' : 'light'}
                  onClick={() => onAvatarSelect(config)}
                  size="sm"
                >
                  {config.name}
                </Button>
              ))}
            </Group>
          </Stack>
        )}

        {avatars3D.length > 0 && (
          <Stack gap="xs">
            <MantineText size="sm" fw={500}>
              3D VRM Models:
            </MantineText>
            <Group gap="xs">
              {avatars3D.map((config) => (
                <Button
                  key={config.id}
                  variant={selectedAvatar?.id === config.id ? 'filled' : 'light'}
                  onClick={() => onAvatarSelect(config)}
                  size="sm"
                >
                  {config.name}
                </Button>
              ))}
            </Group>
          </Stack>
        )}

        {customAvatars.length > 0 && (
          <Stack gap="xs">
            <MantineText size="sm" fw={500}>
              Custom Avatars:
            </MantineText>
            <Group gap="xs">
              {customAvatars.map((config) => (
                <Button
                  key={config.id}
                  variant={selectedAvatar?.id === config.id ? 'filled' : 'light'}
                  onClick={() => onAvatarSelect(config)}
                  size="sm"
                >
                  {config.name}
                </Button>
              ))}
            </Group>
          </Stack>
        )}

        <Button
          variant="outline"
          onClick={() => setUploadModalOpened(true)}
          fullWidth
        >
          Create Custom Avatar
        </Button>

        <Modal
          opened={uploadModalOpened}
          onClose={() => setUploadModalOpened(false)}
          title="Create Custom Avatar"
          size="lg"
        >
          <AvatarUpload
            onAvatarCreated={handleCustomAvatarCreated}
            onCancel={() => setUploadModalOpened(false)}
          />
        </Modal>
      </Stack>
    </Paper>
  );
}

