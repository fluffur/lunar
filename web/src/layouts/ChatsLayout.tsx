import { Outlet, useParams } from "react-router-dom";
import { ActionIcon, Flex, Paper } from "@mantine/core";
import { ChatsSidebar } from "../components/ChatsSidebar.tsx";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";
import { IconLayoutSidebarLeftExpand } from "@tabler/icons-react";

export function ChatsLayout() {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { chatId } = useParams<{ chatId: string }>();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const showSidebar = isMobile ? !chatId : sidebarOpen;
    const showContent = isMobile ? !!chatId : true;

    return (
        <Flex h="calc(100vh - 60px)" style={{ position: 'relative', overflow: 'hidden' }}>
            {(isMobile ? showSidebar : true) && (
                <Paper
                    w={isMobile ? "100%" : 300}
                    withBorder
                    style={{
                        position: isMobile ? 'static' : 'absolute',
                        left: 10,
                        top: 15,
                        bottom: 15,
                        zIndex: 200,
                        flexShrink: 0,
                        transform: isMobile ? 'none' : (sidebarOpen ? 'translateX(0)' : 'translateX(-110%)'),
                        transition: 'transform 0.3s ease',
                        opacity: isMobile ? 1 : (sidebarOpen ? 1 : 0),
                    }}
                >
                    <ChatsSidebar onClose={() => setSidebarOpen(false)} />
                </Paper>
            )}

            {showContent && (
                <Flex style={{ flex: 1, position: 'relative' }} p={isMobile ? 0 : "md"} justify="center">
                    {!isMobile && (
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => setSidebarOpen(true)}
                            style={{
                                position: 'absolute',
                                left: 10,
                                top: 35,
                                zIndex: 201,
                                opacity: sidebarOpen ? 0 : 1,
                                pointerEvents: sidebarOpen ? 'none' : 'auto',
                                transition: 'opacity 0.3s ease',
                            }}
                        >
                            <IconLayoutSidebarLeftExpand size={20} />
                        </ActionIcon>
                    )}
                    <Outlet />
                </Flex>
            )}
        </Flex>
    );
}
