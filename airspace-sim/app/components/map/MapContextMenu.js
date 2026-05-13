'use client'

import {forwardRef} from 'react'
import {Box, Button, Divider, Paper, Stack, Typography} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {
    formatCoordinatePairForGridReferenceSystem,
    getGridReferenceSystemDisplayName,
} from '@/app/tools/formatting/GridReferenceFormatting'

function getContextMenuPosition(elementContainer, contextMenuSize, mapContainerRef) {
    const edgePadding = 8
    const containerWidth = mapContainerRef.current?.clientWidth ?? window.innerWidth
    const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight
    const menuWidth = contextMenuSize.width
    const menuHeight = contextMenuSize.height

    let left = elementContainer.x
    let top = elementContainer.y

    if (menuWidth && left + menuWidth > containerWidth - edgePadding)
        left = elementContainer.x - menuWidth

    if (menuHeight && top + menuHeight > containerHeight - edgePadding)
        top = elementContainer.y - menuHeight

    return {
        left: Math.max(edgePadding, left),
        top: Math.max(edgePadding, top),
    }
}

const MapContextMenu = forwardRef(function MapContextMenu({
                                                                  elementContainer,
                                                                  contextMenuSize,
                                                                  mapContainerRef,
                                                                  onRemoveBearingRangeLine,
                                                                  onClearBearingRangeLines,
                                                                  lines,
                                                              }, ref) {
    const {appSettings} = useAppSettings()

    if (!elementContainer) return null

    const hasBearingRangeLine = Boolean(elementContainer.line)
    const formattedCoordinates = formatCoordinatePairForGridReferenceSystem(
        elementContainer.lngLat.lat,
        elementContainer.lngLat.lng,
        appSettings.gridReferenceSystem,
    )

    return (
        <Paper
            ref={ref}
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            sx={{
                position: 'absolute',
                ...getContextMenuPosition(elementContainer, contextMenuSize, mapContainerRef),
                zIndex: 10,
                width: 220,
                userSelect: 'none',
                overflow: 'hidden',
            }}
        >

            <Box sx={{bgcolor: 'primary.main', p: 2}}>
                <Typography sx={{fontWeight: 'bold', fontFamily: 'monospace', color: 'primary.contrastText'}}>
                    Dynamic Context Menu
                </Typography>
            </Box>

            <Stack spacing={1} sx={{p: 2}}>
                <Typography sx={{fontWeight: 'bold', fontFamily: 'monospace'}}>
                    Position
                </Typography>

                <Typography variant='caption' color='text.secondary' sx={{fontFamily: 'monospace'}}>
                    {getGridReferenceSystemDisplayName(appSettings.gridReferenceSystem)}
                </Typography>

                <Box>
                    {formattedCoordinates.map((coordinateLine) => (
                        <Typography
                            key={coordinateLine}
                            sx={{fontFamily: 'monospace', whiteSpace: 'pre'}}
                        >
                            {coordinateLine}
                        </Typography>
                    ))}
                </Box>

                <Divider/>

                <Typography sx={{fontWeight: 'bold', fontFamily: 'monospace'}}>
                    Bearing/Range Lines
                </Typography>

                {hasBearingRangeLine && (<Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => onRemoveBearingRangeLine(elementContainer.line.id)}
                    sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                    fullWidth
                >
                    Clear line
                </Button>)}

                {!(hasBearingRangeLine && lines.length === 1) && (<Button
                    color='warning'
                    size='small'
                    variant='outlined'
                    onClick={onClearBearingRangeLines}
                    sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                    disabled={lines.length < 1}
                    fullWidth
                >
                    Clear all lines
                </Button>)}
            </Stack>
        </Paper>)
})

export default MapContextMenu