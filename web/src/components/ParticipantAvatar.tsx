import {
  useIsSpeaking,
  VideoTrack,
  useTracks,
  type TrackReference,
} from "@livekit/components-react";
import { Track, Participant } from "livekit-client";
import { Box, Text, Stack, Center } from "@mantine/core";
import { IconMicrophoneOff } from "@tabler/icons-react";
import { useSessionStore } from "../stores/sessionStore";
import { UserAvatar } from "./UserAvatar";

interface ParticipantAvatarProps {
  participant: Participant;
  size?: number;
  showVideo?: boolean;
}

export function ParticipantAvatar({
  participant,
  size = 120,
  showVideo = true,
}: ParticipantAvatarProps) {
  const isSpeaking = useIsSpeaking(participant);
  const isMuted = !participant.isMicrophoneEnabled;
  const isCameraOn = participant.isCameraEnabled;
  const currentUser = useSessionStore((state) => state.user);

  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: false }],
    { onlySubscribed: false },
  ).filter((track) => track.participant.identity === participant.identity);

  const cameraTrack = tracks.find((t) => t.source === Track.Source.Camera);
  const hasValidTrack =
    cameraTrack && "publication" in cameraTrack && cameraTrack.publication;

  const displayName = participant.name || participant.identity || "Unknown";
  const isCurrentUser = currentUser && participant.identity === currentUser.id;
  let avatarUrl: string | null = null;
  if (isCurrentUser) {
    avatarUrl = currentUser.avatarUrl || null;
  } else {
    try {
      const metadata = participant.metadata
        ? JSON.parse(participant.metadata)
        : null;
      if (metadata && metadata.avatarUrl) {
        avatarUrl = metadata.avatarUrl;
      }
    } catch (e) {
      console.warn("Failed to parse participant metadata:", e);
    }
  }

  return (
    <Stack align="center" gap="md">
      <Box
        style={{
          position: "relative",
          borderRadius: "50%",
          padding: 4,
          background: isSpeaking
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : "transparent",
          transition: "all 0.3s ease",
          animation: isSpeaking ? "pulse-speaking 1.5s infinite" : "none",
        }}
      >
        <Box
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            overflow: "hidden",
            border: isSpeaking
              ? "3px solid #22c55e"
              : "3px solid var(--mantine-color-dark-4)",
            transition: "border-color 0.3s ease",
            position: "relative",
            background: "var(--mantine-color-dark-6)",
          }}
        >
          {showVideo && isCameraOn && hasValidTrack && cameraTrack ? (
            <VideoTrack
              trackRef={cameraTrack as TrackReference}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <Center h="100%" w="100%">
              <UserAvatar
                username={displayName}
                avatarUrl={avatarUrl}
                size={size - 10}
                radius="50%"
              />
            </Center>
          )}
        </Box>
        {/* Muted indicator */}
        {isMuted && (
          <Box
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              background: "var(--mantine-color-red-6)",
              borderRadius: "50%",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--mantine-color-dark-7)",
            }}
          >
            <IconMicrophoneOff size={16} color="white" />
          </Box>
        )}
      </Box>

      <Stack gap={4} align="center">
        <Text
          size="lg"
          fw={600}
          style={{
            color: isSpeaking ? "#22c579" : "var(--mantine-color-text)",
            transition: "color 0.3s ease",
          }}
        >
          {displayName}
        </Text>
      </Stack>
    </Stack>
  );
}
