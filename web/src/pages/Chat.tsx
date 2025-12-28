import { useEffect, useRef, useState } from "react";
import { ActionIcon, Box, Button, Flex, Group, Paper, ScrollArea, Stack, Text, Textarea } from "@mantine/core";
import { useNavigate, useParams } from "react-router-dom";
import { useSessionStore } from "../stores/sessionStore.ts";
import { authApi, messageApi } from "../api.ts";
import { IconArrowDown, IconSend2 } from "@tabler/icons-react";
import useWebSocket from "react-use-websocket";
import { isTokenExpired } from "../utils/isTokenExpired.ts";
import axios from "axios";
import NotFound from "./NotFound.tsx";
import { UserAvatar } from "../components/UserAvatar.tsx";
import { API_AVATARS_BASE_URL, WS_BASE_URL } from "../config.ts";
import messagePopAudio from "../assets/message-pop.mp3"
import { formatMessageDate } from "../utils/formatMessageDate.ts";
import { useUiStore } from "../stores/uiStore.ts";
import { useMediaQuery } from "@mantine/hooks";
import { ScreenShareBlock } from "../components/ScreenShareBlock.tsx";

interface Sender {
    id: string;
    username: string;
    avatarUrl?: string;
}

interface ChatMessage {
    content: string;
    chatId: string;
    sender: Sender
    createdAt?: string;
}


export default function Chat() {
    const { chatId } = useParams<string>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const { token, user, setToken, logout } = useSessionStore()
    const [value, setValue] = useState("");

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [notFound, setNotFound] = useState(false);
    const { colorScheme, primaryColor } = useUiStore();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const navigate = useNavigate();

    const [unreadCount, setUnreadCount] = useState(0);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadOlderMessages = async () => {
        if (!nextCursor || loading) return;
        if (!viewportRef.current) return;

        setLoading(true);
        try {
            const { data } = await messageApi.chatsChatIDMessagesGet(
                chatId ?? "",
                50,
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
    };


    const scrollToBottom = () => {
        viewportRef.current?.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: "smooth",
        });
        setUnreadCount(0);
        setIsAtBottom(true);
    };

    const handleScroll = (position: { x: number; y: number }) => {
        if (!viewportRef.current) return;
        if (viewportRef.current.scrollTop < 100 && nextCursor) {
            loadOlderMessages();
        }

        const { scrollHeight, clientHeight } = viewportRef.current;
        const isBottom = scrollHeight - position.y - clientHeight < 100;
        setIsAtBottom(isBottom);
        if (isBottom) {
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        if (!chatId) return;
        setNotFound(false);
        (async () => {
            try {
                const { data } = await messageApi.chatsChatIDMessagesGet(chatId);
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
    }, [chatId, navigate]);

    const [socketUrl, setSocketUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!chatId) {
            return;
        }

        const prepareSocket = async () => {
            const currentToken = useSessionStore.getState().token;

            if (!currentToken || isTokenExpired(currentToken)) {
                try {
                    const { data } = await authApi.authRefreshPost();
                    const newToken = data.accessToken;
                    setToken(newToken);
                    return;
                } catch {
                    logout();
                    setSocketUrl(null);
                    return;
                }
            }

            setSocketUrl(`${WS_BASE_URL}/api/chats/${chatId}/ws?token=${token}`);
        };

        prepareSocket();
    }, [chatId, token, setToken, logout]);


    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const showNotification = (message: ChatMessage) => {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "granted") return;
        console.log(message.sender?.avatarUrl)
        new Notification(message.sender?.username ?? "New message", {
            body: message.content,
            icon: API_AVATARS_BASE_URL + message.sender?.avatarUrl,
        });
    };
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


    const { sendMessage: wsSendMessage } = useWebSocket(
        socketUrl,
        {
            shouldReconnect: () => true,
            reconnectAttempts: 20,
            reconnectInterval: 3000,
            onMessage: (event) => {
                const data = JSON.parse(event.data);
                setMessages(prev => [...prev, data]);

                const isMe = data.sender?.username === user?.username;
                if (!isMe) {
                    const audio = new Audio(messagePopAudio)
                    audio.play()
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

    const sendMessage = () => {
        if (!value.trim()) return;
        wsSendMessage(value.trim().replace(/\n\n+/g, '\n\n'));
        setValue("");
    };


    if (notFound) {
        return (
            <NotFound />
        )

    }
    return (
        <Flex h="100%" w="100%" direction={isMobile ? "column" : "row"} gap={isMobile ? 0 : "md"}>
            <Box style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto' }}>
                <ScreenShareBlock />
            </Box>
            <Paper w={isMobile ? "100%" : 300} h={isMobile ? "auto" : "100%"} shadow="xl" radius={isMobile ? 0 : "lg"} withBorder={!isMobile}
                display="flex"
                style={{
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    flex: isMobile ? 1 : 'none'
                }}>
                <ScrollArea style={{ flex: 1 }} viewportRef={viewportRef} onScrollPositionChange={handleScroll} p="md" pt={0}>
                    <Stack gap="md">
                        {messages.map((m, i) => {
                            const isMe = m.sender?.username === user?.username;
                            return (
                                <Group key={i} align="flex-end" justify={isMe ? 'flex-end' : 'flex-start'} gap="xs"
                                    wrap="nowrap">
                                    {!isMe && m.sender?.username && (
                                        <UserAvatar username={m.sender.username} avatarUrl={m.sender.avatarUrl}
                                            size={32} />

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
                                            bg={colorScheme === 'dark' ?
                                                isMe ? 'dark.4' : 'dark.6'
                                                : isMe ? `${primaryColor}.1` : 'gray.1'
                                            }
                                            c={colorScheme === 'dark' ?
                                                isMe ? 'white' : 'gray.1'
                                                : 'black'
                                            }
                                        >
                                            <Text size="sm" style={{
                                                wordBreak: 'break-word',
                                                whiteSpace: 'pre-wrap'
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
                        })}
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
                            leftSection={<IconArrowDown size={14} />}
                        >
                            {unreadCount} new messages
                        </Button>
                    </div>
                )}

                {!isAtBottom && unreadCount === 0 && (
                    <div style={{ position: 'absolute', bottom: 80, right: 20, zIndex: 10 }}>
                        <ActionIcon
                            onClick={scrollToBottom}
                            radius="xl"
                            size="lg"
                            variant="default"
                            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        >
                            <IconArrowDown size={18} />
                        </ActionIcon>
                    </div>
                )}

                <Paper p="md">

                    <Group gap="sm">
                        <Textarea
                            placeholder="Type a message..."
                            value={value}
                            onChange={(e) => setValue(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            radius="md"
                            size="md"
                            minRows={1}
                            maxRows={5}
                            autosize
                            style={{ flex: 1 }}

                        />
                        <ActionIcon
                            size={38}
                            radius="md"
                            variant="filled"
                            onClick={sendMessage}
                            disabled={!value.trim()}
                        >
                            <IconSend2 />
                        </ActionIcon>
                    </Group>
                </Paper>
            </Paper>
        </Flex>
    );
}
