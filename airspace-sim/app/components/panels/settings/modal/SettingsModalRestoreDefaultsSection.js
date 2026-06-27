'use client'

import {Button, Divider, Stack, Typography} from '@mui/material'

export default function SettingsModalRestoreDefaultsSection({
    label,
    hint,
    onClick,
    color = 'warning',
    showDivider = true,
    buttonSx,
}) {
    const buttonBlock = (
        <Stack spacing={0.5}>
            <Button
                variant='outlined'
                color={color}
                fullWidth
                onClick={onClick}
                sx={buttonSx}
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
    )

    if (!showDivider) {
        return buttonBlock
    }

    return (
        <Stack spacing={2}>
            <Divider/>
            {buttonBlock}
        </Stack>
    )
}
