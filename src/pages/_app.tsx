import '../styles/globals.css';
import { AppProps } from "next/app";
import Head from "next/head";
import { useState, useMemo } from 'react';
import { alert } from '../../config';
import { DarkModeSwitch } from '../Renderer';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CssBaseline from '@mui/material/CssBaseline';
import { PaletteMode } from '@mui/material';

const getDesignTheme = (mode: PaletteMode) => ({
    breakpoints: { // Use breakpoints that tailwindcss uses for more unified design.
        values: {
            xs: 0,
            sm: 640,
            md: 768,
            lg: 1024,
            xl: 1280
        },
    },
    palette: {
        mode,
        ...(mode === 'light'
            ? {
                background: {
                    default: '#d1c2f0',
                    secondary: '#b879ff',
                    paper: '#fff'
                },
                text: {
                    primary: '#000',
                }
            }
            : {
                background: {
                    default: '#25222a',
                    secondary: '#4E0090',
                    paper: '#000'
                },
                text: {
                    primary: '#fff',
                }
            })
    },
    components: {
        MuiTableCell: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'light' ? '#fff' : '#000'
                },
            },
        },
        MuiLink: {
            styleOverrides: {
                root: {
                    color: mode === 'light' ? '#4044ff' : '#809FFF'
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'light' ? '#b879ff' : '#4E0090'
                }
            }
        }
    },

});


export default function App(props: AppProps) {
    const { Component, pageProps } = props;
    const [appOpen, setAppOpen] = useState(true);
    const [mode, setMode] = useState<PaletteMode>('light');


    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode: PaletteMode) =>
                    prevMode === 'light' ? 'dark' : 'light'
                );
            }
        }),
        []
    );

    const theme = useMemo(() => createTheme(getDesignTheme(mode)), [mode]);

    return (
        <>
            <Head>
                <title>SRC Verification Analyzer</title>
                <meta
                    name="viewport"
                    content="minimum-scale=1, initial-scale=1, width=device-width"
                />
            </Head>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {alert &&
                    <Snackbar sx={{ maxWidth: 400 }} ClickAwayListenerProps={{ mouseEvent: false, touchEvent: false }} anchorOrigin={{ vertical: 'top', horizontal: 'right' }} open={appOpen} autoHideDuration={null} onClose={() => setAppOpen(false)}>
                        <Alert className='w-[80%] mx-auto mt-2' severity={alert.type} onClose={() => setAppOpen(false)}>{alert.message}</Alert>
                    </Snackbar>
                }
                <DarkModeSwitch className='z-50 absolute right-0 md:bottom-0 m-2' onClick={colorMode.toggleColorMode} />
                <Component {...pageProps} />
            </ThemeProvider>
        </>
    );
}
