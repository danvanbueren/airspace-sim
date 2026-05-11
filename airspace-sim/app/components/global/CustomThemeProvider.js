'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material'

const ColorModeContext = createContext(null)

export function useColorMode() {
    return useContext(ColorModeContext)
}

export default function CustomThemeProvider({ initialMode = 'light', children }) {
    const [mode, setMode] = useState(initialMode)

    const colorMode = useMemo(
        () => ({
            mode,
            toggleColorMode: () => {
                setMode((currentMode) => {
                    const nextMode = currentMode === 'light' ? 'dark' : 'light'

                    document.cookie = `theme=${nextMode}; path=/; max-age=31536000; SameSite=Lax`

                    return nextMode
                })
            },
            setColorMode: (nextMode) => {
                setMode(nextMode)
                document.cookie = `theme=${nextMode}; path=/; max-age=31536000; SameSite=Lax`
            },
        }),
        [mode]
    )

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                },
                components: {
                    MuiCssBaseline: {
                        styleOverrides: (theme) => ({
                            ':root': {
                                '--scrollbar-thumb': theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.22)'
                                    : 'rgba(0, 0, 0, 0.22)',
                                '--scrollbar-thumb-hover': theme.palette.mode === 'dark'
                                    ? 'rgba(255, 255, 255, 0.44)'
                                    : 'rgba(0, 0, 0, 0.44)',
                            },
                            '*': {
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'var(--scrollbar-thumb) transparent',
                            },
                            '*::-webkit-scrollbar': {
                                width: 10,
                                height: 10
                            },
                            '*::-webkit-scrollbar-track': {
                                background: 'transparent',
                            },
                            '*::-webkit-scrollbar-thumb': {
                                backgroundColor: 'var(--scrollbar-thumb)',
                                borderRadius: 999,
                                border: '3px solid transparent',
                                backgroundClip: 'content-box'
                            },
                            '*::-webkit-scrollbar-thumb:hover': {
                                backgroundColor: 'var(--scrollbar-thumb-hover)',
                            },
                            '*::-webkit-scrollbar-corner': {
                                background: 'transparent',
                            },
                        }),
                    },
                },
            }),
        [mode]
    )

    return (
        <ColorModeContext.Provider value={colorMode}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}