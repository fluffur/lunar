import { Outlet, useParams } from "react-router-dom";
import { ActionIcon, Box, Flex } from "@mantine/core";
import { ChatsSidebar } from "../components/ChatsSidebar.tsx";
import { useMediaQuery } from "@mantine/hooks";
import { useState } from "react";
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand } from "@tabler/icons-react";

export function ChatsLayout() {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { chatId } = useParams<{ chatId: string }>();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const showSidebar = isMobile ? !chatId : sidebarOpen;
    const showContent = isMobile ? !!chatId : true;

    return (
        <Flex h="calc(100vh - 60px)" style={{ position: 'relative', overflow: 'hidden' }}>
            {showSidebar && (
                <Box
                    w={isMobile ? "100%" : 300}
                    style={{
                        position: isMobile ? 'static' : 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 200,
                        flexShrink: 0
                    }}
                >
                    <ChatsSidebar />
                </Box>
            )}

            {showContent && (
                <Flex style={{ flex: 1, position: 'relative' }} p={isMobile ? 0 : "md"} justify="center">
                    {!isMobile && (
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            style={{
                                position: 'absolute',
                                left: sidebarOpen ? 310 : 10,
                                top: 15,
                                zIndex: 201,
                                transition: 'left 0.2s ease'
                            }}
                        >
                            {sidebarOpen ? <IconLayoutSidebarLeftCollapse /> : <IconLayoutSidebarLeftExpand />}
                        </ActionIcon>
                    )}
                    <Outlet />
                </Flex>
            )}
        </Flex>
    );
}
