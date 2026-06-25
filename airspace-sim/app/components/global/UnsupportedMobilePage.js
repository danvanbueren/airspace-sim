'use client'

import {Box, Button, Stack, Typography} from '@mui/material'
import buildInfo from '@/app/buildInfo'
import ClassificationBar from '@/app/components/global/ClassificationBar'

const HEADING_SX = {
    fontWeight: 500,
    lineHeight: 1.25,
    fontSize: 'clamp(1.625rem, 4vw + 0.875rem, 2.125rem)',
    '@media (orientation: portrait)': {
        fontSize: 'clamp(1.75rem, 6vw + 0.5rem, 2.25rem)',
    },
}

const BODY_SX = {
    lineHeight: 1.65,
    fontSize: 'clamp(1.0625rem, 1.5vw + 0.875rem, 1.1875rem)',
    '@media (orientation: portrait)': {
        fontSize: 'clamp(1.1875rem, 2.5vw + 0.875rem, 1.3125rem)',
    },
}

export default function UnsupportedMobilePage() {
    const info = buildInfo()

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100dvh',
                WebkitTextSizeAdjust: '100%',
                textSizeAdjust: '100%',
            }}
        >
            <ClassificationBar/>
            <Box
                sx={{
                    flexGrow: 1,
                    minHeight: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    px: {xs: 2.5, sm: 3},
                    py: {xs: 3, sm: 3},
                }}
            >
                <Stack
                    spacing={{xs: 2.5, sm: 2}}
                    sx={{
                        width: '100%',
                        maxWidth: '28rem',
                        textAlign: 'center',
                    }}
                >
                    <Typography component="h1" sx={HEADING_SX}>
                        Mobile and tablet devices are not supported
                    </Typography>

                    <Typography sx={BODY_SX}>
                        {info.projectName} is designed for desktop browsers with keyboard and mouse controls. Touch input and small viewports are not supported in this release.
                    </Typography>

                    <Typography sx={BODY_SX}>
                        Please open this app on a desktop or laptop computer for the full simulator experience.
                    </Typography>

                    <Button
                        variant="outlined"
                        size="large"
                        href={info.githubIssuesLink}
                        target="_blank"
                        sx={{
                            alignSelf: 'center',
                            minHeight: 48,
                            px: 3,
                            fontSize: {
                                xs: '1.0625rem',
                                sm: '1rem',
                            },
                            '@media (orientation: portrait)': {
                                fontSize: '1.125rem',
                            },
                        }}
                    >
                        Report an issue
                    </Button>
                </Stack>
            </Box>
            <ClassificationBar/>
        </Box>
    )
}
