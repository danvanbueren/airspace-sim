'use client'

import {Box, Card, Divider} from '@mui/material'
import {GLASS_PANEL_BORDER_STYLE, getGlassPanelSurfaceSx} from './glassPanelSurface'

export default function BasicGlassPanel({
    title = null,
    children,
    dense = false,
    width = 400,
    height = null,
    titleAdornment = null,
    hideTitle = false,
    header = null,
    scrollableBody = false,
}) {
    const hasExplicitHeight = typeof height === 'number'

    return (
        <Card
            variant='outlined'
            style={{
                width: dense ? null : width,
                height: hasExplicitHeight ? height : undefined,
                padding: dense ? 5 : 20,
                paddingTop: dense ? 5 : 15,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                alignItems: 'stretch',
                minHeight: 0,
                ...GLASS_PANEL_BORDER_STYLE,
            }}
            sx={(theme) => ({
                ...getGlassPanelSurfaceSx(theme),
                userSelect: 'none',
            })}
        >
            {header}

            { title && !hideTitle && !header && <>
                <Box
                    sx={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        flexShrink: 0,
                    }}
                >
                    {titleAdornment}
                </Box>
                <Divider orientation='horizontal' flexItem sx={{marginBottom: 1.5, flexShrink: 0}} />
            </>}

            <Box
                sx={{
                    width: '100%',
                    minHeight: 0,
                    flexGrow: hasExplicitHeight || scrollableBody ? 1 : 0,
                    overflowY: hasExplicitHeight || scrollableBody ? 'auto' : 'visible',
                    overflowX: 'hidden',
                }}
            >
                {children}
            </Box>
        </Card>
    )
}
