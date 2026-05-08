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