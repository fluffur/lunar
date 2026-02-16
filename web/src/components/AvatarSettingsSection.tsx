import { Stack, Title, Text as MantineText } from '@mantine/core';
import { AvatarSelector, type AvatarConfig } from './LiveAvatar';
import { useState, useEffect } from 'react';
import { useAvatarStore } from '../stores/avatarStore';

export function AvatarSettingsSection() {
  const { config: selectedAvatar, setConfig: setSelectedAvatar } = useAvatarStore();
  const [customAvatars, setCustomAvatars] = useState<AvatarConfig[]>([]);

  useEffect(() => {
    const savedCustom = localStorage.getItem('customAvatars');
    if (savedCustom) {
      try {
        const configs = JSON.parse(savedCustom) as AvatarConfig[];
        setCustomAvatars(configs);
      } catch (error) {
        console.error('Failed to load custom avatars:', error);
      }
    }
  }, []);

  const handleAvatarSelect = (config: AvatarConfig) => {
    setSelectedAvatar(config);
    // localStorage сохраняется автоматически в avatarStore.setConfig()
  };

  const handleCustomAvatarCreated = (config: AvatarConfig) => {
    const updated = [...customAvatars, config];
    setCustomAvatars(updated);
    localStorage.setItem('customAvatars', JSON.stringify(updated));
    setSelectedAvatar(config);
    // localStorage сохраняется автоматически в avatarStore.setConfig()
  };

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Avatar Settings</Title>
        <MantineText size="sm" c="dimmed" mt="xs">
          Choose your avatar for video calls. The avatar will mimic your facial expressions and head movements.
        </MantineText>
      </div>

      <AvatarSelector
        selectedAvatar={selectedAvatar}
        onAvatarSelect={handleAvatarSelect}
        customAvatars={customAvatars}
        onCustomAvatarCreated={handleCustomAvatarCreated}
      />
    </Stack>
  );
}

