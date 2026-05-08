'use client'

import { Fab, Tooltip } from "@mui/material"
import MenuIcon from '@mui/icons-material/Menu';
import { useColorMode } from "../../AppThemeProvider"

export default function ToggleDrawerHamburgerButton() {
    const colorMode = useColorMode()

    const isDark = colorMode.mode === "dark"

    return (
        <Tooltip
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            placement='top'
        >
            <Fab
                onClick={() => alert('todo')}
                color='inherit'
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
                    <MenuIcon />
                }
            </Fab>
        </Tooltip>
    )
}
