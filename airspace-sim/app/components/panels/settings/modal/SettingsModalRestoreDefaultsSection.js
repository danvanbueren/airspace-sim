'use client'

import {Button, Divider, Stack, Typography} from '@mui/material'

export default function SettingsModalRestoreDefaultsSection({label, hint, onClick, color = 'warning'}) {
    return (
        <Stack spacing={2}>
            <Divider/>
            <Stack spacing={1}>
                <Button
                    variant='contained'
                    color={color}
                    fullWidth
                    onClick={onClick}
                >
                    {label}
                </Button>
                <Typography
                    variant='caption'
                    sx={{
                        display: 'block',
                        textAlign: 'center',
                        color: 'text.secondary',
                        whiteSpace: 'pre-line',
                    }}
                >
                    {hint?.replace(/\. /g, '.\n')}
                </Typography>
            </Stack>
        </Stack>
    )
}
