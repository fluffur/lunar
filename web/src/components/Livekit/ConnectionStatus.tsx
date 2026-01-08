import { Box, Group, Badge, Tooltip } from '@mantine/core';
import { IconWifi, IconWifiOff, IconLoader } from '@tabler/icons-react';
import { ConnectionState } from './types';

interface ConnectionStatusProps {
    connectionState: ConnectionState;
    participantCount: number;
}

export function ConnectionStatus({ connectionState, participantCount }: ConnectionStatusProps) {
    const getStatusColor = () => {
        switch (connectionState) {
            case ConnectionState.Connected:
                return 'green';
            case ConnectionState.Connecting:
            case ConnectionState.Reconnecting:
                return 'yellow';
            case ConnectionState.Error:
                return 'red';
            default:
                return 'gray';
        }
    };

    const getStatusIcon = () => {
        switch (connectionState) {
            case ConnectionState.Connected:
                return <IconWifi size={16} />;
            case ConnectionState.Connecting:
            case ConnectionState.Reconnecting:
                return <IconLoader size={16} className="rotating" />;
            case ConnectionState.Error:
            case ConnectionState.Disconnected:
                return <IconWifiOff size={16} />;
            default:
                return <IconWifiOff size={16} />;
        }
    };

    const getStatusText = () => {
        switch (connectionState) {
            case ConnectionState.Connected:
                return 'Connected';
            case ConnectionState.Connecting:
                return 'Connecting...';
            case ConnectionState.Reconnecting:
                return 'Reconnecting...';
            case ConnectionState.Error:
                return 'Connection Error';
            case ConnectionState.Disconnected:
                return 'Disconnected';
            default:
                return 'Unknown';
        }
    };

    return (
        <Box
            style={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                borderRadius: 8,
                padding: '8px 12px',
            }}
        >
            <Group gap="xs">
                <Tooltip label={getStatusText()}>
                    <Badge
                        color={getStatusColor()}
                        variant="filled"
                        leftSection={getStatusIcon()}
                        size="sm"
                    >
                        {connectionState === ConnectionState.Connected && `${participantCount} participant${participantCount !== 1 ? 's' : ''}`}
                        {connectionState !== ConnectionState.Connected && getStatusText()}
                    </Badge>
                </Tooltip>
            </Group>

            <style>{`
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .rotating {
                    animation: rotate 1s linear infinite;
                }
            `}</style>
        </Box>
    );
}
