import {Outlet, useParams} from "react-router-dom";
import {ActionIcon, Box, Flex, Paper, Transition} from "@mantine/core";
import {RoomsSidebar} from "../components/RoomsSidebar.tsx";
import {useMediaQuery} from "@mantine/hooks";
import {useState} from "react";
import {IconChevronRight} from "@tabler/icons-react";

export function RoomsLayout() {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const {roomSlug} = useParams<string>();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [prevRoomSlug, setPrevRoomSlug] = useState(roomSlug);

    if (roomSlug !== prevRoomSlug) {
        setPrevRoomSlug(roomSlug);
        if (isMobile && roomSlug) {
            setSidebarOpen(false);
        }
    }


    return (
        <Flex h="calc(100vh - 60px)" style={{position: 'relative', overflow: 'hidden'}}>
            <Box
                style={{
                    width: isMobile ? (sidebarOpen ? '100%' : 0) : (sidebarOpen ? 310 : 0),
                    transition: 'width 0.3s ease',
                    position: isMobile ? 'absolute' : 'relative',
                    height: '100%',
                    zIndex: 200,
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                <Transition mounted={sidebarOpen} transition="slide-right" duration={300} timingFunction="ease">
                    {(styles) => (
                        <Paper
                            withBorder
                            style={{
                                ...styles,
                                position: 'absolute',
                                width: 300,
                                height: isMobile ? '100%' : 'calc(100% - 30px)',
                                left: isMobile ? 0 : 10,
                                top: isMobile ? 0 : 15,
                                zIndex: 200,
                                borderRadius: isMobile ? 0 : 'var(--mantine-radius-lg)',
                            }}
                        >
                            <RoomsSidebar onClose={() => setSidebarOpen(false)}/>
                        </Paper>
                    )}
                </Transition>
            </Box>

            <Box style={{
                flex: 1,
                position: 'relative',
                height: '100%',
                overflow: 'hidden'
            }}>
                {!sidebarOpen && (
                    <ActionIcon
                        variant="filled"
                        size="lg"
                        onClick={() => setSidebarOpen(true)}
                        style={{
                            position: 'absolute',
                            left: 10,
                            top: isMobile ? 10 : 25,
                            zIndex: 100,
                            borderRadius: '50%',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    >
                        <IconChevronRight size={20}/>
                    </ActionIcon>
                )}
                <Flex h="100%" p={isMobile ? 0 : "md"} justify="center" style={{position: 'relative'}}>
                    <Outlet/>
                </Flex>
            </Box>
        </Flex>
    );
}


