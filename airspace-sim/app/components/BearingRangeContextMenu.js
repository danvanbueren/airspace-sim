'use client'

import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'

export default function BearingRangeContextMenu({
                                                    contextMenu,
                                                    onRemoveBearingRangeLine,
                                                    onClearBearingRangeLines,
                                                }) {
    if (!contextMenu)
        return null

    const hasBearingRangeLine = Boolean(contextMenu.line)

    return (
        <Paper
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            sx={{
                position: 'fixed',
                left: contextMenu.x,
                top: contextMenu.y,
                zIndex: 10,
                minWidth: 220,
                p: 1,
                backgroundColor: 'background.paper',
            }}
        >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {hasBearingRangeLine ? 'Bearing/Range Line' : 'Map Options'}
            </Typography>

            <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    {contextMenu.lngLat.lat.toFixed(4)}, {contextMenu.lngLat.lng.toFixed(4)}
                </Typography>
            </Box>

            {hasBearingRangeLine && (
                <>
                    <Divider sx={{ my: 1 }} />

                    <Stack spacing={0.5}>
                        <Button
                            color="error"
                            size="small"
                            onClick={() => onRemoveBearingRangeLine(contextMenu.line.id)}
                            sx={{ justifyContent: 'flex-start' }}
                        >
                            Remove this bearing/range line
                        </Button>

                        <Button
                            color="error"
                            size="small"
                            onClick={onClearBearingRangeLines}
                            sx={{ justifyContent: 'flex-start' }}
                        >
                            Clear all bearing/range lines
                        </Button>
                    </Stack>
                </>
            )}
        </Paper>
    )
}