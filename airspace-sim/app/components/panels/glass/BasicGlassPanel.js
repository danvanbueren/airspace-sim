'use client'

import { alpha, Card, Divider, Typography } from '@mui/material'

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
                borderWidth: 2,
                borderRadius: '2%',
            }}
            sx={(theme) => ({
                backgroundColor: alpha(theme.palette.background.paper, 0.3),
                backdropFilter: 'blur(10px)',
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
