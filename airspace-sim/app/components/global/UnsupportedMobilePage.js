'use client'

import {Box, Button, Stack, Typography} from '@mui/material'
import buildInfo from '@/app/buildInfo'
import ClassificationBar from '@/app/components/global/ClassificationBar'

const MOBILE_BAR_SX = {
    minHeight: 'clamp(1.75rem, 5dvh, 2.5rem)',
    maxHeight: 'clamp(1.75rem, 5dvh, 2.5rem)',
    '& .MuiTypography-root': {
        fontSize: 'clamp(0.875rem, 2.5vw + 0.5dvh, 1.125rem)',
    },
}

const HEADING_SX = {
    fontWeight: 600,
    lineHeight: 1.2,
    fontSize: 'clamp(1.5rem, 5vw + 1.5dvh, 2.5rem)',
}

const WARNING_ICON_SX = {
    fontSize: 'clamp(3rem, 12vw + 2dvh, 5rem)',
    lineHeight: 1,
}

const BODY_SX = {
    lineHeight: 1.5,
    fontSize: 'clamp(1.0625rem, 3.5vw + 0.75dvh, 1.375rem)',
}

const CONTENT_GAP = 'clamp(0.875rem, 3vw + 1dvh, 1.75rem)'
const CONTENT_PADDING_X = 'clamp(1rem, 5vw, 2rem)'
const CONTENT_PADDING_Y = 'clamp(1rem, 3dvh, 2rem)'

const CONTENT_STACK_SX = {
    width: '100%',
    boxSizing: 'border-box',
    mx: 'auto',
    px: CONTENT_PADDING_X,
    py: CONTENT_PADDING_Y,
    textAlign: 'center',
    gap: CONTENT_GAP,
    '@media (orientation: portrait)': {
        maxWidth: '100%',
    },
    '@media (orientation: landscape)': {
        maxWidth: 'min(50vw, 40rem)',
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
                maxHeight: '100dvh',
                overflow: 'hidden',
                WebkitTextSizeAdjust: '100%',
                textSizeAdjust: '100%',
            }}
        >
            <ClassificationBar sx={MOBILE_BAR_SX}/>
            <Box
                component="main"
                sx={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    justifyContent: 'center',
                    width: '100%',
                }}
            >
                <Stack
                    spacing={0}
                    sx={CONTENT_STACK_SX}
                >
                    <Box
                        component="span"
                        role="img"
                        aria-hidden="true"
                        sx={WARNING_ICON_SX}
                    >
                        ⚠️
                    </Box>

                    <Typography component="h1" variant="inherit" sx={HEADING_SX}>
                        Unsupported Device
                    </Typography>

                    <Typography variant="inherit" sx={BODY_SX}>
                        {info.projectName} is designed for desktop browsers with keyboard and mouse controls. Touch input and small viewports are not supported in this release.
                    </Typography>

                    <Typography variant="inherit" sx={BODY_SX}>
                        Please open this app on a desktop or laptop computer for the full simulator experience.
                    </Typography>

                    <Button
                        variant="outlined"
                        size="large"
                        href={info.githubIssuesLink}
                        target="_blank"
                        sx={{
                            alignSelf: 'center',
                            minHeight: 'clamp(2.75rem, 8vw + 2dvh, 3.5rem)',
                            px: 'clamp(1.25rem, 5vw, 2rem)',
                            py: 1,
                            fontSize: 'clamp(1.0625rem, 3.5vw + 0.75dvh, 1.3125rem)',
                            lineHeight: 1.3,
                        }}
                    >
                        Report an issue
                    </Button>
                </Stack>
            </Box>
            <ClassificationBar sx={MOBILE_BAR_SX}/>
        </Box>
    )
}
