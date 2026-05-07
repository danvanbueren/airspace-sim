'use client'

import { Fab, Tooltip } from "@mui/material"
import MenuIcon from '@mui/icons-material/Menu';
import { useColorMode } from "../../AppThemeProvider"

export default function ToggleThemeButton() {
    const colorMode = useColorMode()

    const isDark = colorMode.mode === "dark"

    return (
        <Tooltip
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            placement='top'
        >
            <Fab
                onClick={colorMode.toggleColorMode}
                color='inherit'
                sx={{
                    backgroundColor: 'background.paper',
                    '&:hover': {
                        backgroundColor: '#fff',
                    }
                }}
            >
                {
                    <MenuIcon />
                }
            </Fab>
        </Tooltip>
    )
}
