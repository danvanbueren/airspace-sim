'use client'

import {Box, Button, Stack, Typography} from '@mui/material'
import buildInfo from '@/app/buildInfo'
import ClassificationBar from '@/app/components/global/ClassificationBar'

export default function UnsupportedMobilePage() {
    const info = buildInfo()

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100dvh',
            }}
        >
            <ClassificationBar/>
            <Box
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                }}
            >
                <Stack
                    spacing={2}
                    sx={{
                        maxWidth: '32rem',
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h5">
                        Mobile and tablet devices are not supported
                    </Typography>

                    <Typography sx={{lineHeight: 1.7}}>
                        {info.projectName} is designed for desktop browsers with keyboard and mouse controls. Touch input and small viewports are not supported in this release.
                    </Typography>

                    <Typography sx={{lineHeight: 1.7}}>
                        Please open this app on a desktop or laptop computer for the full simulator experience.
                    </Typography>

                    <Button
                        variant="outlined"
                        href={info.githubIssuesLink}
                        target="_blank"
                        sx={{alignSelf: 'center'}}
                    >
                        Report an issue
                    </Button>
                </Stack>
            </Box>
            <ClassificationBar/>
        </Box>
    )
}
