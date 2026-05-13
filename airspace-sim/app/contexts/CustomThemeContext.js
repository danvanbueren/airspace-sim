'use client'

import {createContext, useContext, useEffect, useMemo, useState} from 'react'
import {ThemeProvider, CssBaseline, createTheme} from '@mui/material'
import {
    parseCookieValue,
    readCookieValue,
    writeCookieValue,
} from '@/app/tools/browser/CookieStorage'

export const THEME_COOKIE_NAME = 'theme'

const ColorModeContext = createContext(null)

export function useColorMode() {
    return useContext(ColorModeContext)
}

function normalizeColorMode(mode) {
    return mode === 'light' ? 'light' : 'dark'
}

function parseInitialMode(initialMode) {
    return normalizeColorMode(parseCookieValue(initialMode, 'dark'))
}

function readBrowserMode() {
    return normalizeColorMode(parseCookieValue(readCookieValue(THEME_COOKIE_NAME), 'dark'))
}

function writeThemeCookie(mode) {
    writeCookieValue(THEME_COOKIE_NAME, normalizeColorMode(mode))
}

export default function CustomThemeContext({initialMode = 'dark', children}) {
    const [mode, setMode] = useState(() => parseInitialMode(initialMode))

    useEffect(() => {
        const browserMode = readBrowserMode()

        setMode((currentMode) => (
            currentMode === browserMode ? currentMode : browserMode
        ))
    }, [])

    const colorMode = useMemo(
        () => ({
            mode,
            toggleColorMode: () => {
                setMode((currentMode) => {
                    const nextMode = currentMode === 'light' ? 'dark' : 'light'

                    writeThemeCookie(nextMode)

                    return nextMode
                })
            },
            setColorMode: (nextMode) => {
                const normalizedMode = normalizeColorMode(nextMode)

                setMode(normalizedMode)
                writeThemeCookie(normalizedMode)
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
                <CssBaseline/>
                {children}
            </ThemeProvider>
        </ColorModeContext.Provider>
    )
}