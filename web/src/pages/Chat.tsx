import {useEffect, useRef, useState} from "react";
import {ActionIcon, Button, Center, Group, Paper, ScrollArea, Stack, Text, Textarea} from "@mantine/core";
import {useNavigate, useParams} from "react-router-dom";
import {useSessionStore} from "../stores/sessionStore.ts";
import {authApi, messageApi} from "../api.ts";
import {IconArrowDown, IconSend2} from "@tabler/icons-react";
import useWebSocket from "react-use-websocket";
import {isTokenExpired} from "../utils.ts";
import axios from "axios";
import NotFound from "./NotFound.tsx";
import {UserAvatar} from "../components/UserAvatar.tsx";
import {WS_BASE_URL} from "../config.ts";

interface Sender {
    id: string;
    username: string;
    avatarUrl?: string;
}

interface ChatMessage {
    content: string;
    chatId?: string;
    sender?: Sender
    createdAt?: string;
}


export default function Chat() {
    const {chatId} = useParams<string>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const {token, user, setToken, logout} = useSessionStore()
    const [value, setValue] = useState("");

    const viewportRef = useRef<HTMLDivElement | null>(null);
    const [notFound, setNotFound] = useState(false);

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
            const {data} = await messageApi.chatsChatIDMessagesGet(
                chatId ?? "",
                50,
                encodeURIComponent(nextCursor),
            );

            const scrollContainer = viewportRef.current;
            const prevScrollHeight = scrollContainer.scrollHeight;

            setMessages(prev => [...data?.data?.messages?.reverse() ?? [], ...prev]);

            setNextCursor(data?.data?.nextCursor ?? null);

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

        const {scrollHeight, clientHeight} = viewportRef.current;
        const isBottom = scrollHeight - position.y - clientHeight < 100;
        setIsAtBottom(isBottom);
        if (isBottom) {
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        if (!chatId) return;

        (async () => {
            try {
                const {data} = await messageApi.chatsChatIDMessagesGet(chatId);
                setMessages(data.data?.messages?.reverse() ?? []);
                setNextCursor(data.data?.nextCursor ?? null);
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
                    const {data} = await authApi.authRefreshPost();
                    const newToken = data.data.accessToken;
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

    const {sendMessage: wsSendMessage} = useWebSocket(
        socketUrl,
        {
            shouldReconnect: () => true,
            reconnectAttempts: 20,
            reconnectInterval: 3000,
            onMessage: (event) => {
                const data = JSON.parse(event.data);
                setMessages(prev => [...prev, data]);

                const isMe = data.sender?.username === user?.username;

                if (isMe || isAtBottom) {
                    setTimeout(scrollToBottom, 100);
                } else {
                    setUnreadCount(c => c + 1);
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

    const formatMessageDate = (date?: string) => {
        if (!date) return "";

        const d = new Date(date);

        return d.toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const [windowHeight, _] = useState(window.innerHeight);


    if (notFound) {
        return (
            <NotFound/>
        )

    }

    return (
        <Center h={windowHeight - 80} p="md">
            <Paper w="100%" maw={500} h="100%" shadow="xl" radius="lg" withBorder display="flex"
                   style={{flexDirection: 'column', overflow: 'hidden', position: 'relative'}}>
                <ScrollArea style={{flex: 1}} viewportRef={viewportRef} onScrollPositionChange={handleScroll} p="md">
                    <Stack gap="md">
                        {messages.map((m, i) => {
                            const isMe = m.sender?.username === user?.username;
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
                                            bg={isMe ? 'dark.4' : 'dark.6'}
                                            c={isMe ? 'white' : 'gray.1'}
                                        >
                                            <Text size="sm" style={{
                                                wordBreak: 'break-word',
                                                whiteSpace: 'pre-wrap'
                                            }}>{m.content}


                                            </Text>

                                        </Paper>
                                        {m.createdAt && (
                                            <Text
                                                size="xs"
                                                c={isMe ? 'gray.4' : 'gray.5'}
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
                            style={{flex: 1}}

                        />
                        <ActionIcon
                            size={38}
                            radius="md"
                            variant="filled"
                            onClick={sendMessage}
                            disabled={!value.trim()}
                        >
                            <IconSend2/>
                        </ActionIcon>
                    </Group>
                </Paper>
            </Paper>
        </Center>
    );
}
