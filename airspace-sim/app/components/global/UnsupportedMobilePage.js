'use client'

import {useRef} from 'react'
import {Box, Button, Stack, Typography} from '@mui/material'
import buildInfo from '@/app/buildInfo'
import ClassificationBar from '@/app/components/global/ClassificationBar'
import {useMobileFallbackFitScale} from '@/app/hooks/global/useMobileFallbackFitScale'

const MOBILE_BAR_SX = {
    flexShrink: 0,
    minHeight: '1.75rem',
    maxHeight: '1.75rem',
    '& .MuiTypography-root': {
        fontSize: '0.875rem',
    },
}

const EMOJI_TITLE_GAP = '0.5rem'
const SECTION_GAP = '1.75rem'
const PHONE_SECTION_GAP = '1.25rem'

const HEADING_SX = {
    fontWeight: 600,
    lineHeight: 1.2,
    fontSize: {xs: '1.75rem', sm: '1.625rem'},
}

const WARNING_ICON_SX = {
    fontSize: {xs: '3rem', sm: '2.75rem'},
    lineHeight: 1,
}

const BODY_SX = {
    lineHeight: 1.5,
    fontSize: {xs: '1.0625rem', sm: '0.9375rem'},
}

export default function UnsupportedMobilePage() {
    const info = buildInfo()
    const mainRef = useRef(null)
    const contentRef = useRef(null)
    const {scale, margins, layoutProfile, ready} = useMobileFallbackFitScale(mainRef, contentRef)
    const isPhoneLayout = layoutProfile === 'phone'

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
                ref={mainRef}
                sx={{
                    flex: '1 1 auto',
                    minHeight: 0,
                    overflow: isPhoneLayout ? 'auto' : 'hidden',
                    display: 'flex',
                    width: '100%',
                }}
            >
                <Box
                    sx={{
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: isPhoneLayout ? 'flex-start' : 'center',
                        justifyContent: isPhoneLayout ? 'flex-start' : 'center',
                        flex: '1 1 auto',
                        minHeight: isPhoneLayout ? 'auto' : 0,
                        minWidth: 0,
                        overflow: 'hidden',
                        pl: `${margins.horizontal}px`,
                        pr: `${margins.horizontal}px`,
                        pt: `${margins.vertical}px`,
                        pb: `${margins.vertical}px`,
                    }}
                >
                    <Box
                        ref={contentRef}
                        sx={{
                            width: '100%',
                            transform: scale === 1 ? undefined : `scale(${scale})`,
                            transformOrigin: 'center center',
                            visibility: ready ? 'visible' : 'hidden',
                        }}
                    >
                        <Stack
                            spacing={0}
                            sx={{
                                width: '100%',
                                boxSizing: 'border-box',
                                textAlign: 'center',
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

                            <Typography
                                component="h1"
                                variant="inherit"
                                sx={{...HEADING_SX, mt: EMOJI_TITLE_GAP}}
                            >
                                Unsupported Device
                            </Typography>

                            <Typography
                                variant="inherit"
                                sx={{
                                    ...BODY_SX,
                                    mt: isPhoneLayout ? PHONE_SECTION_GAP : SECTION_GAP,
                                }}
                            >
                                {info.projectName} is designed for desktop browsers with keyboard and mouse controls. Touch input and small viewports are not supported in this release.
                            </Typography>

                            <Typography
                                variant="inherit"
                                sx={{
                                    ...BODY_SX,
                                    mt: isPhoneLayout ? PHONE_SECTION_GAP : SECTION_GAP,
                                }}
                            >
                                Please open this app on a desktop or laptop computer for the full simulator experience.
                            </Typography>

                            <Button
                                variant="outlined"
                                size="large"
                                href={info.githubIssuesLink}
                                target="_blank"
                                sx={{
                                    alignSelf: 'center',
                                    mt: isPhoneLayout ? PHONE_SECTION_GAP : SECTION_GAP,
                                    minHeight: {xs: '3rem', sm: '2.75rem'},
                                    px: 2.5,
                                    fontSize: {xs: '1.0625rem', sm: '0.9375rem'},
                                    lineHeight: 1.3,
                                }}
                            >
                                Report an issue
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Box>
            <ClassificationBar sx={MOBILE_BAR_SX}/>
        </Box>
    )
}
