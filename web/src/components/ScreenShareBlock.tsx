import { AspectRatio, Center, Paper, Text } from "@mantine/core";
import { IconDeviceTv } from "@tabler/icons-react";
import {useMediaQuery} from "@mantine/hooks";

export function ScreenShareBlock() {
    const isMobile = useMediaQuery('(max-width: 768px)');

    return (
        <Paper shadow="xl" radius={isMobile ? 0 : "lg"} style={{overflow: 'hidden', backgroundColor: 'black', height: '100%'}}>
            <AspectRatio ratio={16 / 9} style={{maxHeight: '100%'}}>
                <Center h="100%" style={{flexDirection: 'column', color: 'gray'}}>
                    <IconDeviceTv size={48} stroke={1.5}/>
                    <Text mt="sm">Waiting for stream...</Text>
                </Center>
            </AspectRatio>
        </Paper>
    );
}
