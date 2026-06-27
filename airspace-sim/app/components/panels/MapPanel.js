'use client'

import {Card, Divider, Typography} from '@mui/material'
import {MAP_PANEL_BORDER_STYLE, getMapPanelSurfaceSx} from './panelSurface'

export default function MapPanel({title = null, children, dense = false}) {

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
                ...MAP_PANEL_BORDER_STYLE,
            }}
            sx={(theme) => ({
                ...getMapPanelSurfaceSx(theme),
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
