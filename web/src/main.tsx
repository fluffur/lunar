import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {RouterProvider} from "react-router-dom";
import {router} from "./router.tsx";
import {MantineProvider} from "@mantine/core";
import '@mantine/core/styles.css'
import {createAppTheme} from "./theme.ts";
import {useUiStore} from "./stores/uiStore.ts";
import {WebSocketProvider} from './contexts/WebSocketContext.tsx';
import {CallProvider} from './contexts/CallContext.tsx';

export function Root() {
    const {primaryColor, colorScheme} = useUiStore()

    return (
        <StrictMode>
            <MantineProvider theme={createAppTheme(primaryColor)} forceColorScheme={colorScheme}>
                <WebSocketProvider>
                    <CallProvider>
                        <RouterProvider router={router}/>
                    </CallProvider>
                </WebSocketProvider>
            </MantineProvider>
        </StrictMode>
    );
}

createRoot(document.getElementById('root')!).render(<Root/>)
