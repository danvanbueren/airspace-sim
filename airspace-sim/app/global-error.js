'use client'

import {useEffect} from 'react'
import {Button} from '@mui/material'

export default function GlobalError({error, reset}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <html lang="en">
        <body>
        <main
            style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                padding: '2rem',
                fontFamily: 'sans-serif',
            }}
        >
            <h1>Critical application error</h1>

            <pre
                style={{
                    maxWidth: '40rem',
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                }}
            >
                        {error?.message || 'Unknown root application error'}
                    </pre>

            <Button variant="contained" onClick={() => reset()}>
                Try again
            </Button>
        </main>
        </body>
        </html>
    )
}