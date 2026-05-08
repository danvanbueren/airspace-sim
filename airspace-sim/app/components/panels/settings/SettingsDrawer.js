'use client'

import { alpha, Box, Card, Collapse } from '@mui/material'
import { useRef, useState } from 'react'
import ToggleThemeButton from './ToggleThemeButton'
import ToggleSettingsDrawerButton from './ToggleSettingsDrawerButton'

export default function SettingsDrawer() {

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
                        <ToggleThemeButton/>
                    </Box>
                </Collapse>
            </Box>
        </Card>
    )
}
