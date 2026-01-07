    import {useCallback, useEffect, useMemo, useRef, useState} from "react";
    import {
        ActionIcon,
        Box,
        Button,
        Drawer,
        Flex,
        Group,
        Paper,
        Popover,
        ScrollArea,
        Stack,
        Text,
        Textarea,
        Tooltip
    } from "@mantine/core";
    import {useParams} from "react-router-dom";
    import {useSessionStore} from "../stores/sessionStore.ts";
    import {IconArrowDown, IconMoodSmile, IconSend2, IconUsers} from "@tabler/icons-react";
    import NotFound from "./NotFound.tsx";
    import {UserAvatar} from "../components/UserAvatar.tsx";
    import {API_AVATARS_BASE_URL} from "../config.ts";
    import messagePopAudio from "../assets/message-pop.mp3"
    import {formatMessageDate} from "../utils/formatMessageDate.ts";
    import {useUiStore} from "../stores/uiStore.ts";
    import {useMediaQuery} from "@mantine/hooks";
    import {EmojiPicker} from "../components/EmojiPicker.tsx";
    import {isEmojiOnly} from "../utils/isEmojiOnly.ts";
    import type {EmojiClickData} from "emoji-picker-react";
    import type {ModelMessage} from "../../api";

    import {useRoomMessages} from "../hooks/useRoomMessages";
    import {useRoomWebSocket} from "../hooks/useRoomWebSocket";
    import {useScrollManagement} from "../hooks/useScrollManagement";
    import {RoomMembers} from "../components/RoomMembers.tsx";
    import {LiveKitRoomWrapper} from "../components/Livekit/LiveKitRoomWrapper.tsx";
    import {RoomVideo} from "../components/Livekit/RoomVideo.tsx";

    export default function Room() {
        const {roomSlug} = useParams<string>();
        const {user} = useSessionStore()
        const {colorScheme, primaryColor} = useUiStore();
        const isMobile = useMediaQuery('(max-width: 768px)');

        const [memberSidebarOpen, setMemberSidebarOpen] = useState(false);
        const [value, setValue] = useState("");
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const messageAudioRef = useRef(new Audio(messagePopAudio));

        const [isTabVisible, setIsTabVisible] = useState(document.visibilityState === "visible");

        const {
            messages,
            notFound,
            loadOlderMessages,
            addMessage,
            nextCursor
        } = useRoomMessages(roomSlug);

        const {
            viewportRef,
            unreadCount,
            isAtBottom,
            scrollToBottom,
            handleScroll,
            incrementUnread
        } = useScrollManagement();

        const showNotification = useCallback((message: ModelMessage) => {
            if (!("Notification" in window) || Notification.permission !== "granted") return;
            new Notification(message.sender?.username ?? "New message", {
                body: message.content,
                icon: API_AVATARS_BASE_URL + message.sender?.avatarUrl,
            });
        }, []);

        const onMessageReceived = useCallback((data: ModelMessage) => {
            addMessage(data);

            const isMe = data.sender?.username === user?.username;
            if (!isMe) {
                messageAudioRef.current.play().catch(() => {
                });
            }

            if (isMe || isAtBottom) {
                setTimeout(() => scrollToBottom("smooth"), 100);
            } else {
                showNotification(data);
                incrementUnread();
            }

            if (!isMe && !isTabVisible) {
                showNotification(data);
            }
        }, [user?.username, isAtBottom, isTabVisible, addMessage, scrollToBottom, showNotification, incrementUnread]);

        const {sendRoomMessage} = useRoomWebSocket({
            roomSlug,
            onMessageReceived
        });

        useEffect(() => {
            if (messages.length > 0 && isAtBottom) {
                scrollToBottom("auto");
            }
        }, [messages.length, isAtBottom, scrollToBottom]);

        useEffect(() => {
            const handleVisibilityChange = () => setIsTabVisible(document.visibilityState === "visible");
            document.addEventListener("visibilitychange", handleVisibilityChange);
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }
            return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
        }, []);

        const sendMessage = useCallback(() => {
            if (!value.trim()) return;
            sendRoomMessage(value);
            setValue("");
        }, [value, sendRoomMessage]);

        const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
            const emoji = emojiData.emoji;
            const cursor = textareaRef.current?.selectionStart || value.length;
            const newValue = value.slice(0, cursor) + emoji + value.slice(cursor);
            setValue(newValue);
            setShowEmojiPicker(false);
        }, [value]);

        const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        }, [sendMessage]);

        const renderedMessages = useMemo(() => {
            return messages.map((m, i) => {
                const isMe = m.sender?.username === user?.username;
                const emojiOnly = isEmojiOnly(m.content);
                return (
                    <Group key={i} align="flex-end" justify={isMe ? 'flex-end' : 'flex-start'} gap="xs" wrap="nowrap">
                        {!isMe && m.sender?.username && (
                            <UserAvatar username={m.sender.username} avatarUrl={m.sender.avatarUrl} size={32}/>
                        )}
                        <Stack gap={4} align={isMe ? 'flex-end' : 'flex-start'} maw="70%">
                            {!isMe && m.sender?.username && (
                                <Text size="xs" c="dimmed" lh={1}>
                                    {m.sender.username}
                                </Text>
                            )}
                            <Paper
                                p="xs"
                                px="sm"
                                bg={emojiOnly ? "none" : (colorScheme === 'dark' ? (isMe ? 'dark.4' : 'dark.6') : (isMe ? `${primaryColor}.1` : 'gray.1'))}
                                c={colorScheme === 'dark' ? (isMe ? 'white' : 'gray.1') : 'black'}
                            >
                                <Text size={emojiOnly ? "2rem" : "sm"} style={{
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: emojiOnly ? 1.2 : undefined
                                }}>
                                    {m.content}
                                </Text>
                            </Paper>
                            {m.createdAt && (
                                <Text size="xs" style={{userSelect: 'none'}}>
                                    {formatMessageDate(m.createdAt)}
                                </Text>
                            )}
                        </Stack>
                    </Group>
                );
            });
        }, [messages, user?.username, colorScheme, primaryColor]);

        if (notFound) return <NotFound/>;

        return (
            <LiveKitRoomWrapper roomSlug={roomSlug!}>
                <Flex h="100%" w="100%" direction="row" gap="md" style={{overflow: 'hidden'}}>
                    <Box style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                        <Flex h="100%" w="100%" direction={isMobile ? "column" : "row"} gap={isMobile ? 0 : "md"}
                              style={{flex: 1, overflow: 'hidden'}}>
                            <Box
                                style={{
                                    width: isMobile ? '100%' : 'auto',
                                    height: isMobile ? '35vh' : '35vh',
                                    minHeight: isMobile ? 220 : undefined,
                                    background: 'black',
                                }}
                            >
                                <RoomVideo />
                            </Box>

                            <Paper w={isMobile ? "100%" : 400} h={isMobile ? "auto" : "100%"} shadow="xl"
                                   radius={isMobile ? 0 : "lg"}
                                   withBorder={!isMobile}
                                   display="flex"
                                   style={{
                                       flexDirection: 'column',
                                       overflow: 'hidden',
                                       position: 'relative',
                                       flex: isMobile ? 1 : 'none'
                                   }}>
                                <Box p="sm"
                                     style={{borderBottom: `1px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-2)'}`}}>
                                    <Group justify="space-between">
                                        <Text fw={700} size="sm">Chat</Text>
                                        <Tooltip label={memberSidebarOpen ? "Hide Members" : "Show Members"}>
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                onClick={() => setMemberSidebarOpen(!memberSidebarOpen)}
                                            >
                                                <IconUsers size={20}/>
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Box>

                                <ScrollArea
                                    style={{flex: 1}}
                                    viewportRef={viewportRef}
                                    onScrollPositionChange={(pos) => handleScroll(pos, nextCursor, loadOlderMessages)}
                                    p="md"
                                    pt={isMobile ? 0 : "md"}
                                >
                                    <Stack gap="md">
                                        {renderedMessages}
                                    </Stack>
                                </ScrollArea>

                                {!isAtBottom && unreadCount > 0 && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 80,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        zIndex: 10
                                    }}>
                                        <Button
                                            onClick={() => scrollToBottom("smooth")}
                                            radius="xl"
                                            size="xs"
                                            variant="filled"
                                            leftSection={<IconArrowDown size={14}/>}
                                        >
                                            {unreadCount} new messages
                                        </Button>
                                    </div>
                                )}

                                {!isAtBottom && unreadCount === 0 && (
                                    <div style={{position: 'absolute', bottom: 80, right: 20, zIndex: 10}}>
                                        <ActionIcon
                                            onClick={() => scrollToBottom("smooth")}
                                            radius="xl"
                                            size="lg"
                                            variant="default"
                                            style={{boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                        >
                                            <IconArrowDown size={18}/>
                                        </ActionIcon>
                                    </div>
                                )}

                                <Paper p="md" style={{position: 'relative'}}>
                                    <Popover opened={showEmojiPicker} onChange={setShowEmojiPicker} position="top-start"
                                             withArrow
                                             shadow="md">
                                        <Popover.Target>
                                            <ActionIcon
                                                variant="subtle"
                                                color="gray"
                                                size="lg"
                                                onClick={() => setShowEmojiPicker((o) => !o)}
                                                style={{position: 'absolute', left: 16, top: 24, zIndex: 5}}
                                            >
                                                <IconMoodSmile size={20}/>
                                            </ActionIcon>
                                        </Popover.Target>
                                        <Popover.Dropdown p={0}>
                                            <EmojiPicker onEmojiClick={handleEmojiClick}/>
                                        </Popover.Dropdown>
                                    </Popover>

                                    <Group gap="sm" align="flex-end">
                                        <Textarea
                                            ref={textareaRef}
                                            placeholder="Type a message..."
                                            value={value}
                                            onChange={(e) => setValue(e.currentTarget.value)}
                                            onKeyDown={handleTextareaKeyDown}
                                            radius="md"
                                            size="md"
                                            minRows={1}
                                            maxRows={5}
                                            autosize
                                            style={{flex: 1}}
                                            pl={40}
                                        />
                                        <ActionIcon
                                            size={38}
                                            radius="md"
                                            variant="filled"
                                            onClick={sendMessage}
                                            disabled={!value.trim()}
                                            mb={4}
                                        >
                                            <IconSend2/>
                                        </ActionIcon>
                                    </Group>
                                </Paper>
                            </Paper>
                        </Flex>
                    </Box>

                    <Box
                        style={{
                            width: !isMobile && memberSidebarOpen ? 280 : 0,
                            transition: 'width 0.3s ease',
                            overflow: 'hidden',
                            height: '100%',
                            flexShrink: 0
                        }}
                    >
                        <Paper
                            w={280}
                            h="100%"
                            shadow="xl"
                            radius="lg"
                            withBorder
                            style={{
                                position: 'relative',
                            }}
                        >
                            <RoomMembers onClose={() => setMemberSidebarOpen(false)}/>
                        </Paper>
                    </Box>

                    <Drawer
                        opened={isMobile && memberSidebarOpen}
                        onClose={() => setMemberSidebarOpen(false)}
                        position="right"
                        size="85%"
                        padding={0}
                        withCloseButton={false}
                        styles={{
                            content: {borderRadius: '16px 0 0 16px'}
                        }}
                    >
                        <RoomMembers onClose={() => setMemberSidebarOpen(false)}/>
                    </Drawer>
                </Flex>
            </LiveKitRoomWrapper>
        );
    }
