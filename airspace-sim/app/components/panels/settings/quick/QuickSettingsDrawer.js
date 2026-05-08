'use client'

import { alpha, Box, Card, Collapse, Divider } from '@mui/material'
import { useRef, useState } from 'react'
import { useColorMode } from "@/app/components/base/CustomThemeProvider"
import ToggleSettingsDrawerButton from './ToggleSettingsDrawerButton'
import QuickSettingsButton from "./QuickSettingsButton"
import HistoryEduIcon from '@mui/icons-material/HistoryEdu'
import SettingsIcon from '@mui/icons-material/Settings'
import KeyboardIcon from '@mui/icons-material/Keyboard'
import InfoIcon from '@mui/icons-material/Info'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'

export default function QuickSettingsDrawer() {

    const [open, setOpen] = useState(false)
    const collapseTimerRef = useRef(null)

    const handleMouseEnter = () => {
        if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current)
            collapseTimerRef.current = null
        }
    }

    const handleMouseLeave = () => {
        collapseTimerRef.current = setTimeout(() => {
            setOpen(false)
            collapseTimerRef.current = null
        }, 3000)
    }

    const colorMode = useColorMode()
    const isDark = colorMode.mode === 'dark'

    return (
        <Card
            variant='outlined'

            sx={(theme) => ({
                padding: 1,
                borderWidth: 2,
                borderRadius: '3rem',
                userSelect: 'none',
                backgroundColor: alpha(theme.palette.background.paper, open ? 0.3 : 0),
                borderColor: alpha(theme.palette.divider, open ? 0.12 : 0),
                backdropFilter: open ? 'blur(10px)' : 'blur(0px)',
                WebkitBackdropFilter: open ? 'blur(10px)' : 'blur(0px)',
                transition: 'background-color 250ms ease, border-color 250ms ease, backdrop-filter 250ms ease, -webkit-backdrop-filter 250ms ease',
            })}

            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Box
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Box
                    sx={{
                        padding: 0.5,
                    }}
                >
                    <ToggleSettingsDrawerButton
                        open={open}
                        setOpen={setOpen}
                    />
                </Box>

                <Collapse
                    in={open}
                    timeout={250}
                    unmountOnExit
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            padding: 1.5,
                            pointerEvents: open ? 'auto' : 'none',
                        }}
                    >
                        <QuickSettingsButton
                            icon = {isDark ? <LightModeIcon /> : <DarkModeIcon />}
                            tooltip={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            onClick={colorMode.toggleColorMode}
                        />

                        <Divider/>

                        <QuickSettingsButton
                            icon = {<SettingsIcon/>}
                            tooltip='Settings'
                            onClick={() => alert('Settings feature coming soon!')}
                        />

                        <QuickSettingsButton
                            icon = {<KeyboardIcon/>}
                            tooltip='Keybinds'
                            onClick={() => alert('Keybinds feature coming soon!')}
                        />

                        <QuickSettingsButton
                            icon = {<HistoryEduIcon/>}
                            tooltip='Roadmap'
                            onClick={() => alert('Roadmap feature coming soon!')}
                        />
                        {/*
                        TODO: Hide cursor tooltip when drawing bearing/range line.
                        TODO: Create settings modal
                        */}

                        <QuickSettingsButton
                            icon = {<InfoIcon/>}
                            tooltip='About'
                            onClick={() => alert('About feature coming soon!')}
                        />
                    </Box>
                </Collapse>
            </Box>
        </Card>
    )
}
