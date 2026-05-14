'use client'

import {useEffect} from 'react'
import {Box, Button, Typography} from '@mui/material'

export default function Error({error, reset}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <Box
            sx={{
                height: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: 3,
            }}
        >
            <Typography variant="h5">
                Something went wrong
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    maxWidth: '40rem',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                }}
            >
                {error?.message || 'Unknown application error'}
            </Typography>

            <Button variant="contained" onClick={() => reset()}>
                Try again
            </Button>
        </Box>
    )
}