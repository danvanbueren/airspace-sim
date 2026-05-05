'use client'

import {Box, Typography, useMediaQuery, useTheme} from "@mui/material"

export default function ClassificationBar({
                                              theme = useTheme(),
                                              classificationText = 'UNCLASSIFIED',
                                              textColor = '#fff',
                                              backgroundColor = '#007a33',
                                              height = '1.5rem',
                                          }) {

    const isLgUp = useMediaQuery(theme.breakpoints.up('lg'))

    /*
     * Classification & Control Markings - Astro UXDS
     * https://www.astrouxds.com/components/classification-markings/
     */


    return (
        <Box
            sx={{
                alignItems: 'center',
                display: 'flex',
                flexShrink: 0,
                justifyContent: 'center',
                background: backgroundColor,
                color: textColor,
                minHeight: height,
                maxHeight: height,
            }}
        >
            <Typography
                sx={{
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    fontSize: isLgUp ? '1.0rem' : '0.7rem',
                }}
            >
                {classificationText}
            </Typography>
        </Box>
    )
}