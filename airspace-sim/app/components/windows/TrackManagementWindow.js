'use client'

import {forwardRef} from 'react'
import {Box, Button, Divider, Paper, Stack, Typography} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {formatCoordinatePairForGridReferenceSystem} from '@/app/tools/formatting/GridReferenceFormatting'

function getTrackManagementWindowPosition(trackManagementWindow, mapContainerRef) {
    const edgePadding = 8
    const containerWidth = mapContainerRef.current?.clientWidth ?? window.innerWidth
    const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight
    const windowWidth = 300
    const estimatedWindowHeight = 220

    let left = trackManagementWindow.x
    let top = trackManagementWindow.y

    if (left + windowWidth > containerWidth - edgePadding)
        left = trackManagementWindow.x - windowWidth

    if (top + estimatedWindowHeight > containerHeight - edgePadding)
        top = trackManagementWindow.y - estimatedWindowHeight

    return {
        left: Math.max(edgePadding, left),
        top: Math.max(edgePadding, top),
    }
}

const TrackManagementWindow = forwardRef(function TrackManagementWindow({
                                                                            trackManagementWindow,
                                                                            mapContainerRef,
                                                                            onClose,
                                                                        }, ref) {
    const {appSettings} = useAppSettings()

    const formattedCoordinates = formatCoordinatePairForGridReferenceSystem(
        trackManagementWindow.lngLat.lat,
        trackManagementWindow.lngLat.lng,
        appSettings.gridReferenceSystem,
    )

    return (
        <Paper
            ref={ref}
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            sx={{
                position: 'absolute',
                ...getTrackManagementWindowPosition(trackManagementWindow, mapContainerRef),
                zIndex: 10,
                width: 300,
                userSelect: 'none',
                overflow: 'hidden',
            }}
        >
            <Box sx={{bgcolor: 'primary.main', p: 2}}>
                <Typography
                    sx={{
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        color: 'primary.contrastText',
                        fontSize: '0.9rem',
                    }}
                >
                    Track Management
                </Typography>
            </Box>

            <Stack spacing={1.5} sx={{p: 2}}>
                <Typography sx={{fontWeight: 'bold', fontFamily: 'monospace'}}>
                    Track ID: {trackManagementWindow.trackId}
                </Typography>

                <Box>
                    {formattedCoordinates.map((coordinateLine) => (
                        <Typography
                            key={coordinateLine}
                            sx={{fontFamily: 'monospace', whiteSpace: 'pre', fontSize: '0.8rem'}}
                        >
                            {coordinateLine}
                        </Typography>
                    ))}
                </Box>

                <Divider/>

                <Typography sx={{fontFamily: 'monospace', fontSize: '0.8rem'}}>
                    Track-specific controls and details will go here.
                </Typography>

                <Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => onClose(trackManagementWindow.id)}
                    sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                    fullWidth
                >
                    Close
                </Button>
            </Stack>
        </Paper>
    )
})

export default TrackManagementWindow