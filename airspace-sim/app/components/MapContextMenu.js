'use client'

import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'

export default function MapContextMenu({
                                                    elementContainer,
                                                    onRemoveBearingRangeLine,
                                                    onClearBearingRangeLines,
                                                }) {
    if (!elementContainer)
        return null

    const hasBearingRangeLine = Boolean(elementContainer.line)

    return (
        <Paper
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            sx={{
                position: 'fixed',
                left: elementContainer.x,
                top: elementContainer.y,
                zIndex: 10,
                minWidth: 220,
                p: 1,
                backgroundColor: 'background.paper',
            }}
        >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Dynamic Context Menu
            </Typography>

            <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    {elementContainer.lngLat.lat.toFixed(4)}, {elementContainer.lngLat.lng.toFixed(4)}
                </Typography>
            </Box>

            {hasBearingRangeLine && (
                <>
                    <Divider sx={{ my: 1 }} />

                    <Typography variant="body2" sx={{paddingBottom: 1}}>
                        Bearing/Range Lines
                    </Typography>

                    <Stack spacing={0.5}>
                        <Button
                            color="primary"
                            size="small"
                            onClick={() => onRemoveBearingRangeLine(elementContainer.line.id)}
                            sx={{ justifyContent: 'flex-start' }}
                        >
                            Clear line
                        </Button>

                        <Button
                            color="error"
                            size="small"
                            onClick={onClearBearingRangeLines}
                            sx={{ justifyContent: 'flex-start' }}
                        >
                            Clear all lines
                        </Button>
                    </Stack>
                </>
            )}
        </Paper>
    )
}