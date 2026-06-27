'use client'

import {Box, Card, Divider, Typography} from '@mui/material'
import {GLASS_PANEL_BORDER_STYLE, getGlassPanelSurfaceSx} from './glassPanelSurface'

export default function BasicGlassPanel({
    title = null,
    children,
    dense = false,
    width = 400,
    titleAdornment = null,
    hideTitle = false,
}) {

    return (
        <Card
            variant='outlined'
            style={{
                width: dense ? null : width,
                padding: dense ? 5 : 20,
                paddingTop: dense ? 5 : 15,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                alignItems: 'center',
                ...GLASS_PANEL_BORDER_STYLE,
            }}
            sx={(theme) => ({
                ...getGlassPanelSurfaceSx(theme),
                userSelect: 'none',
            })}
        >
            { title && !hideTitle && <>
                <Box
                    sx={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                    }}
                >
                    <Typography
                        variant='h6'
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            flexGrow: 1,
                            minWidth: 0,
                        }}
                    >
                        {title}
                    </Typography>
                    {titleAdornment}
                </Box>
                <Divider orientation='horizontal' flexItem sx={{marginBottom: 1.5}} />
            </>}

            {children}
        </Card>
    )
}
