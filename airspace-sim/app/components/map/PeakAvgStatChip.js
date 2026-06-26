'use client'

import {useLayoutEffect, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'

const MONO_LABEL_SX = {
    fontFamily: 'monospace',
    fontSize: '0.68rem',
    lineHeight: 1.35,
}

export default function PeakAvgStatChip({
    leadingValue,
    avgValue,
    resolveLabel,
    valueColor = 'rgba(255, 255, 255, 0.9)',
}) {
    const containerRef = useRef(null)
    const measureRef = useRef(null)
    const [label, setLabel] = useState(() => resolveLabel(leadingValue, avgValue, () => true))

    useLayoutEffect(() => {
        const container = containerRef.current
        const measureElement = measureRef.current

        if (!container || !measureElement) {
            return undefined
        }

        const updateLabel = () => {
            const fits = (candidate) => {
                measureElement.textContent = candidate
                return measureElement.scrollWidth <= container.clientWidth
            }
            const nextLabel = resolveLabel(leadingValue, avgValue, fits)

            setLabel((previous) => (previous === nextLabel ? previous : nextLabel))
        }

        updateLabel()

        const resizeObserver = new ResizeObserver(updateLabel)
        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()
        }
    }, [avgValue, leadingValue, resolveLabel])

    return (
        <Box ref={containerRef} sx={{minWidth: 0, overflow: 'hidden', position: 'relative'}}>
            <Typography
                ref={measureRef}
                component='span'
                aria-hidden
                sx={{
                    ...MONO_LABEL_SX,
                    position: 'absolute',
                    visibility: 'hidden',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                }}
            />
            <Typography
                component='span'
                sx={{
                    ...MONO_LABEL_SX,
                    color: valueColor,
                    whiteSpace: 'nowrap',
                }}
            >
                {label}
            </Typography>
        </Box>
    )
}
