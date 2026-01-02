import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ActionIcon, Box, Button, Flex, Group, Paper, Popover, ScrollArea, Stack, Text, Textarea} from "@mantine/core";
import {useNavigate, useParams} from "react-router-dom";
import {useSessionStore} from "../stores/sessionStore.ts";
import {authApi, messageApi} from "../api.ts";
import {IconArrowDown, IconMoodSmile, IconSend2} from "@tabler/icons-react";
import useWebSocket from "react-use-websocket";
import {isTokenExpired} from "../utils/isTokenExpired.ts";
import axios from "axios";
import NotFound from "./NotFound.tsx";
import {UserAvatar} from "../components/UserAvatar.tsx";
import {API_AVATARS_BASE_URL, WS_BASE_URL} from "../config.ts";
import messagePopAudio from "../assets/message-pop.mp3"
import {formatMessageDate} from "../utils/formatMessageDate.ts";
import {useUiStore} from "../stores/uiStore.ts";
import {useMediaQuery} from "@mantine/hooks";
import {ScreenShareBlock} from "../components/ScreenShareBlock.tsx";
import {EmojiPicker} from "../components/EmojiPicker.tsx";
import {isEmojiOnly} from "../utils/isEmojiOnly.ts";
import type {EmojiClickData} from "emoji-picker-react";
import type {ModelMessage} from "../../api";

export default function Room() {
    const {roomSlug} = useParams<string>();
    const [messages, setMessages] = useState<ModelMessage[]>([]);
    const {token, user, setToken, logout} = useSessionStore()
    const [value, setValue] = useState("");
    const messageAudioRef = useRef(new Audio(messagePopAudio));
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [notFound, setNotFound] = useState(false);
    const {colorScheme, primaryColor} = useUiStore();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadOlderMessages = useCallback(async () => {
        if (!nextCursor || loading || !viewportRef.current || !roomSlug) return;

        setLoading(true);
        try {
            const {data} = await messageApi.roomsRoomSlugMessagesGet(
                roomSlug,
                5,
                encodeURIComponent(nextCursor),
            );

            const scrollContainer = viewportRef.current;
            const prevScrollHeight = scrollContainer.scrollHeight;

            setMessages(prev => [...data.messages?.reverse() ?? [], ...prev]);

            setNextCursor(data.nextCursor ?? null);

            setTimeout(() => {
                const newScrollHeight = scrollContainer.scrollHeight;
                scrollContainer.scrollTop = newScrollHeight - prevScrollHeight;
            }, 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [nextCursor, loading, roomSlug]);


    const scrollToBottom = useCallback(() => {
        viewportRef.current?.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: "smooth",
        });
        setUnreadCount(0);
        setIsAtBottom(true);
    }, []);

    const handleScroll = useCallback((position: { x: number; y: number }) => {
        if (!viewportRef.current) return;
        if (viewportRef.current.scrollTop < 100 && nextCursor) {
            loadOlderMessages();
        }

        const {scrollHeight, clientHeight} = viewportRef.current;
        const isBottom = scrollHeight - position.y - clientHeight < 100;
        setIsAtBottom(isBottom);
        if (isBottom) {
            setUnreadCount(0);
        }
    }, [nextCursor, loadOlderMessages]);

    useEffect(() => {
        if (!roomSlug) return;
        setNotFound(false);
        (async () => {
            try {
                const {data} = await messageApi.roomsRoomSlugMessagesGet(roomSlug, 10);
                setMessages(data.messages?.reverse() ?? []);
                setNextCursor(data.nextCursor ?? null);
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 404) {
                        setNotFound(true);
                    }
                }
                console.error(error);
            }
        })();
    }, [roomSlug, navigate]);

    const [socketUrl, setSocketUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!roomSlug) {
            return;
        }

        const prepareSocket = async () => {
            const currentToken = useSessionStore.getState().token;

            if (!currentToken || isTokenExpired(currentToken)) {
                try {
                    const {data} = await authApi.authRefreshPost();
                    const newToken = data.accessToken;
                    setToken(newToken);
                    return;
                } catch {
                    logout();
                    setSocketUrl(null);
                    return;
                }
            }

            setSocketUrl(`${WS_BASE_URL}/api/rooms/${roomSlug}/ws?token=${token}`);
        };

        prepareSocket();
    }, [roomSlug, token, setToken, logout]);


    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const showNotification = useCallback((message: ModelMessage) => {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;
        console.log(message.sender?.avatarUrl)
        new Notification(message.sender?.username ?? "New message", {
            body: message.content,
            icon: API_AVATARS_BASE_URL + message.sender?.avatarUrl,
        });
    }, []);
    const [isTabVisible, setIsTabVisible] = useState(
        document.visibilityState === "visible"
    );
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsTabVisible(document.visibilityState === "visible");
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);


    const {sendMessage: wsSendMessage} = useWebSocket(
        socketUrl,
        {
            shouldReconnect: () => {
                const currentToken = useSessionStore.getState().token;
                if (currentToken && isTokenExpired(currentToken)) {
                    authApi.authRefreshPost().then(({data}) => {
                        setToken(data.accessToken);
                    }).catch(() => {
                        logout();
                    });
                    return false;
                }
                return true;
            },
            reconnectAttempts: 20,
            reconnectInterval: 3000,
            onMessage: (event) => {
                const data = JSON.parse(event.data);
                setMessages(prev => [...prev, data]);

                const isMe = data.sender?.username === user?.username;
                if (!isMe) {
                    messageAudioRef.current.play()
                }
                if (isMe || isAtBottom) {
                    setTimeout(scrollToBottom, 100);
                } else {
                    showNotification(data);
                    setUnreadCount(c => c + 1);
                }
                if (!isMe && !isTabVisible) {
                    showNotification(data);
                }
            }
        }
    );

    useEffect(() => {
        if (messages.length > 0 && isAtBottom) {
            viewportRef.current?.scrollTo({
                top: viewportRef.current.scrollHeight,
                behavior: "auto",
            });
        }
    }, [isAtBottom, messages.length]);

    const sendMessage = useCallback(() => {
        if (!value.trim()) return;
        wsSendMessage(value.trim().replace(/\n\n+/g, '\n\n'));
        setValue("");
    }, [value, wsSendMessage]);


    const handleEmojiClick = useCallback((emojiData: EmojiClickData) => {
        const emoji = emojiData.emoji;
        const cursor = textareaRef.current?.selectionStart || value.length;
        const newValue = value.slice(0, cursor) + emoji + value.slice(cursor);
        setValue(newValue);
        setShowEmojiPicker(false);
    }, [value]);

    const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.currentTarget.value);
    }, []);

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
                <Group key={i} align="flex-end" justify={isMe ? 'flex-end' : 'flex-start'} gap="xs"
                       wrap="nowrap">
                    {!isMe && m.sender?.username && (
                        <UserAvatar username={m.sender.username} avatarUrl={m.sender.avatarUrl}
                                    size={32}/>

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
                            bg={
                                emojiOnly ? "none" :
                                    (colorScheme === 'dark' ?
                                            isMe ? 'dark.4' : 'dark.6'
                                            : isMe ? `${primaryColor}.1` : 'gray.1'
                                    )}
                            c={colorScheme === 'dark' ?
                                isMe ? 'white' : 'gray.1'
                                : 'black'
                            }
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
                            <Text
                                size="xs"
                                style={{
                                    userSelect: 'none',
                                }}
                            >
                                {formatMessageDate(m.createdAt)}
                            </Text>
                        )}
                    </Stack>
                </Group>
            );
        });
    }, [messages, user?.username, colorScheme, primaryColor]);


    if (notFound) {
        return (
            <NotFound/>
        )

    }
    return (
        <Flex h="100%" w="100%" direction={isMobile ? "column" : "row"} gap={isMobile ? 0 : "md"}>
            <Box style={{flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto'}}>
                <ScreenShareBlock/>
            </Box>
            <Paper w={isMobile ? "100%" : 300} h={isMobile ? "auto" : "100%"} shadow="xl" radius={isMobile ? 0 : "lg"}
                   withBorder={!isMobile}
                   display="flex"
                   style={{
                       flexDirection: 'column',
                       overflow: 'hidden',
                       position: 'relative',
                       flex: isMobile ? 1 : 'none'
                   }}>
                <ScrollArea style={{flex: 1}} viewportRef={viewportRef} onScrollPositionChange={handleScroll} p="md"
                            pt={isMobile ? 0 : "md"}>
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
                            onClick={scrollToBottom}
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
                            onClick={scrollToBottom}
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

                    <Popover opened={showEmojiPicker} onChange={setShowEmojiPicker} position="top-start" withArrow
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
                            onChange={handleTextareaChange}
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
    );
}
