'use client'

import {Card, Divider, Typography} from '@mui/material'
import {GLASS_PANEL_BORDER_STYLE, getGlassPanelSurfaceSx} from './glassPanelSurface'

export default function BasicGlassPanel({title = null, children, dense = false}) {

    return (
        <Card
            variant='outlined'
            style={{
                width: dense ? null : 400,
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
            { title && <>
                <Typography variant='h6' style={{fontFamily: 'monospace', fontWeight: 'bold'}}>{title}</Typography>
                <Divider orientation='horizontal' flexItem sx={{marginBottom: 1.5}} />
            </>}

            {children}
        </Card>
    )
}
