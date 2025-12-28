import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import {BrowserRouter} from "react-router-dom";
import {MantineProvider} from "@mantine/core";
import '@mantine/core/styles.css'
import {createAppTheme} from "./theme.ts";
import {useUiStore} from "./stores/uiStore.ts";

function Root() {
    const {primaryColor, colorScheme} = useUiStore()

    return (
        <StrictMode>
            <MantineProvider theme={createAppTheme(primaryColor)} forceColorScheme={colorScheme}>
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </MantineProvider>
        </StrictMode>
    );
}

createRoot(document.getElementById('root')!).render(<Root/>)
