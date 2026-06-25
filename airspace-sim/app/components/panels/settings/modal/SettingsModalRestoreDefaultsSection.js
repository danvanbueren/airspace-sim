'use client'

import {Button, Divider, Stack, Typography} from '@mui/material'

export default function SettingsModalRestoreDefaultsSection({
    label,
    hint,
    onClick,
    color = 'warning',
    showDivider = true,
}) {
    return (
        <Stack spacing={2}>
            {showDivider ? <Divider/> : null}
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
                    }}
                >
                    {hint}
                </Typography>
            </Stack>
        </Stack>
    )
}
