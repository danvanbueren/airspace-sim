'use client'

import {Box, Typography} from '@mui/material'

export default function AlarmAlertMessageContent({
    message,
    messageIcon = null,
    truncate = false,
    maxLength = 120,
    typographySx = {},
}) {
    const displayMessage = truncate && message.length > maxLength
        ? `${message.slice(0, maxLength)}...`
        : message

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
            }}
        >
            {messageIcon ? (
                <Typography
                    component='span'
                    aria-hidden='true'
                    sx={{
                        flexShrink: 0,
                        fontSize: 16,
                        lineHeight: 1.4,
                    }}
                >
                    {messageIcon}
                </Typography>
            ) : null}
            <Typography
                sx={{
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    flex: 1,
                    minWidth: 0,
                    ...typographySx,
                }}
            >
                {displayMessage}
            </Typography>
        </Box>
    )
}
