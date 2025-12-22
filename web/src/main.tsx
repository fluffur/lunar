import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import '@mantine/core/styles.css'
import {theme} from "./theme.ts";

function Root() {
    return (
        <StrictMode>
            <MantineProvider theme={theme} defaultColorScheme="dark">
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </MantineProvider>
        </StrictMode>
    );
}

createRoot(document.getElementById('root')!).render(<Root />)
