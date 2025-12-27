import {createTheme} from '@mantine/core';

export const theme = createTheme({
    primaryColor: 'teal',
    defaultRadius: 'md',
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    headings: {
        fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    },
    components: {
        Button: {
            defaultProps: {
                size: 'md',
            },
        },
        TextInput: {
            defaultProps: {
                variant: 'filled',
            },
        },
        PasswordInput: {
            defaultProps: {
                variant: 'filled',
            },
        },
        Paper: {
            defaultProps: {
                shadow: 'xl',
            },
        },
    },
});