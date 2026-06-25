'use client'

import { Box, Typography, useMediaQuery, useTheme } from '@mui/material'
import {UI_Z_INDEX} from '@/app/constants/uiZIndex'

export default function ClassificationBar({
                                              theme = useTheme(),
                                              classificationText = 'UNCLASSIFIED',
                                              textColor = '#fff',
                                              backgroundColor = '#007a33',
                                              height = '1.5rem',
                                              fontSize,
                                              sx,
                                          }) {

    const isLgUp = useMediaQuery(theme.breakpoints.up('lg'))
    const resolvedFontSize = fontSize ?? (isLgUp ? '1.0rem' : '0.7rem')

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
                position: 'relative',
                zIndex: UI_Z_INDEX.CLASSIFICATION_BAR,
                ...sx,
            }}
        >
            <Typography
                sx={{
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    fontSize: resolvedFontSize,
                    userSelect: 'none',
                }}
            >
                {classificationText}
            </Typography>
        </Box>
    )
}