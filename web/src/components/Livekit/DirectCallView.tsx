import {
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import { CustomControlBar } from "./CustomControlBar.tsx";
import { Box, Text, Stack, Group } from "@mantine/core";
import { useEffect, useMemo } from "react";

import { ParticipantAvatar } from "../ParticipantAvatar.tsx";

interface DirectCallViewProps {
  onDisconnect?: () => void;
}

export function DirectCallView({ onDisconnect }: DirectCallViewProps) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const styleId = "direct-call-pulse-animation";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
            @keyframes pulse-speaking {
                0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(34, 197, 94, 0); }
                100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
            }
        `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  const allParticipants = useMemo(() => {
    const all = [];
    if (localParticipant) {
      all.push(localParticipant);
    }
    const remoteParticipants = participants.filter(
      (p) => p.identity !== localParticipant?.identity,
    );
    all.push(...remoteParticipants);
    return all;
  }, [participants, localParticipant]);

  // не скролим
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto"; // дефолт для оверфлоу
    };
  }, []);

  return (
    <Box
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, var(--mantine-color-dark-8) 0%, var(--mantine-color-dark-9) 100%)",
        position: "fixed",
        top: 0,
        left: 0,
        overflow: "hidden",
      }}
    >
      <Box
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {allParticipants.length === 0 ? (
          <Stack align="center" gap="xl">
            <Text c="dimmed" size="lg">
              Waiting for others to join...
            </Text>
          </Stack>
        ) : (
          <Group gap={60} justify="center" wrap="nowrap">
            {allParticipants.map((participant) => (
              <ParticipantAvatar
                key={participant.identity}
                participant={participant}
                size={180}
              />
            ))}
          </Group>
        )}
      </Box>

      <RoomAudioRenderer />
      <CustomControlBar onDisconnect={onDisconnect} />
    </Box>
  );
}
