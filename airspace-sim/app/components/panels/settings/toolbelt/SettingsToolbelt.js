'use client'

import {alpha, Box, Card, Collapse, Divider} from '@mui/material'
import {useRef} from 'react'
import SettingsToolbeltToggleOpenButton from './SettingsToolbeltToggleOpenButton'
import SettingsToolbeltGenericButton from './SettingsToolbeltGenericButton'

export default function SettingsToolbelt({toolbeltOpen, setToolbeltOpen, buildData}) {

    const toolbeltAutoCollapseTimer = useRef(null)

    const handleMouseEnterToolbelt = () => {
        if (toolbeltAutoCollapseTimer.current) {
            clearTimeout(toolbeltAutoCollapseTimer.current)
            toolbeltAutoCollapseTimer.current = null
        }
    }

    const handleMouseLeaveToolbelt = () => {
        toolbeltAutoCollapseTimer.current = setTimeout(() => {
            setToolbeltOpen(false)
            toolbeltAutoCollapseTimer.current = null
        }, 3000)
    }

    return (<>
        <Card
            variant='outlined'

            sx={(theme) => ({
                padding: 1,
                borderWidth: 2,
                borderRadius: '3rem',
                userSelect: 'none',
                backgroundColor: alpha(theme.palette.background.paper, toolbeltOpen ? 0.3 : 0),
                borderColor: alpha(theme.palette.divider, toolbeltOpen ? 0.12 : 0),
                backdropFilter: toolbeltOpen ? 'blur(10px)' : 'blur(0px)',
                WebkitBackdropFilter: toolbeltOpen ? 'blur(10px)' : 'blur(0px)',
                transition: 'background-color 250ms ease, border-color 250ms ease, backdrop-filter 250ms ease, -webkit-backdrop-filter 250ms ease',
            })}

            onMouseEnter={handleMouseEnterToolbelt}
            onMouseLeave={handleMouseLeaveToolbelt}
        >
            <Box
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '90dvh', overflow: 'auto'
                }}
            >
                <Box
                    sx={{
                        padding: 0.5,
                    }}
                >
                    <SettingsToolbeltToggleOpenButton
                        open={toolbeltOpen}
                        setOpen={setToolbeltOpen}
                    />
                </Box>

                <Collapse
                    in={toolbeltOpen}
                    timeout={250}
                    unmountOnExit
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                            padding: 1.5,
                            pointerEvents: toolbeltOpen ? 'auto' : 'none',
                        }}
                    >
                        {buildData.oneClick.map((object, index) => (<SettingsToolbeltGenericButton
                            key={'SettingsToolbelt-OneClick-' + object.name + '-' + index}
                            icon={object.icon}
                            tooltip={object.tooltip}
                            onClick={object.onToolbeltClick}
                        />))}

                        <Divider/>

                        {buildData.full.map((object, index) => (<SettingsToolbeltGenericButton
                            key={'SettingsToolbelt-Full-' + object.name + '-' + index}
                            icon={object.icon}
                            tooltip={object.tooltip}
                            onClick={object.onToolbeltClick}
                        />))}
                    </Box>
                </Collapse>
            </Box>
        </Card>
    </>)
}
