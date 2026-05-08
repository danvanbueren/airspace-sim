'use client'

import { Fab, Tooltip } from "@mui/material"
import DarkModeIcon from "@mui/icons-material/DarkMode"
import LightModeIcon from "@mui/icons-material/LightMode"
import { useColorMode } from "../../AppThemeProvider"

export default function ToggleThemeButton() {
    const colorMode = useColorMode()

    const isDark = colorMode.mode === "dark"

    return (
        <Tooltip
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            placement='left'
        >
            <Fab
                onClick={colorMode.toggleColorMode}
                color='inherit'
                size='small'
                sx={{
                    color: 'primary.main',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                        color: 'primary.contrastText',
                        backgroundColor: 'primary.main',
                    },
            }}
            >
                {
                    isDark ?
                        <LightModeIcon /> :
                        <DarkModeIcon />
                }
            </Fab>
        </Tooltip>
    )
}
