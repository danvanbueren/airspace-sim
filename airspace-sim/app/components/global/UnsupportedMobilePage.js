'use client'

import {Box, Button, Stack, Typography} from '@mui/material'
import buildInfo from '@/app/buildInfo'
import ClassificationBar from '@/app/components/global/ClassificationBar'

const MOBILE_BAR_SX = {
    minHeight: 'clamp(1.75rem, 6dvh, 2.5rem)',
    maxHeight: 'clamp(1.75rem, 6dvh, 2.5rem)',
    '& .MuiTypography-root': {
        fontSize: 'clamp(14px, 3.5dvh, 18px)',
    },
}

const HEADING_SX = {
    fontWeight: 600,
    lineHeight: 1.2,
    fontSize: 'clamp(20px, 6dvh, 32px)',
}

const WARNING_ICON_SX = {
    fontSize: 'clamp(2.75rem, 11dvh, 4.5rem)',
    lineHeight: 1,
}

const BODY_SX = {
    lineHeight: 1.5,
    fontSize: 'clamp(16px, 3.8dvh, 22px)',
}

const CONTENT_GAP = 'clamp(0.75rem, 2.5dvh, 1.5rem)'
const CONTENT_PADDING_Y = 'clamp(0.75rem, 2dvh, 1.5rem)'

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
                }}
            >
                <Stack
                    spacing={0}
                    sx={{
                        width: '100%',
                        maxWidth: '26rem',
                        mx: 'auto',
                        my: 'auto',
                        px: 3,
                        py: CONTENT_PADDING_Y,
                        textAlign: 'center',
                        gap: CONTENT_GAP,
                        boxSizing: 'border-box',
                    }}
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
                            minHeight: 'clamp(40px, 10dvh, 52px)',
                            px: 4,
                            py: 1,
                            fontSize: 'clamp(16px, 3.8dvh, 21px)',
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
