'use client'

import {forwardRef} from 'react'
import {Box, Button, Divider, Paper, Stack, Typography} from '@mui/material'
import {formatLatLong} from "@/app/tools/formatting/PrettyLatLong";

const MapContextMenu = forwardRef(function MapContextMenu({
                                                              elementContainer,
                                                              onRemoveBearingRangeLine,
                                                              onClearBearingRangeLines,
                                                              lines,
                                                          }, ref) {
    if (!elementContainer) return null

    const hasBearingRangeLine = Boolean(elementContainer.line)

    return (
        <Paper
            ref={ref}
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            sx={{
                position: 'fixed',
                left: elementContainer.x,
                top: elementContainer.y,
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

                <Box>
                    <Typography sx={{fontFamily: 'monospace', whiteSpace: 'pre'}}>
                        LAT: {formatLatLong(elementContainer.lngLat.lat)}
                    </Typography>

                    <Typography sx={{fontFamily: 'monospace', whiteSpace: 'pre'}}>
                        LNG: {formatLatLong(elementContainer.lngLat.lng)}
                    </Typography>
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