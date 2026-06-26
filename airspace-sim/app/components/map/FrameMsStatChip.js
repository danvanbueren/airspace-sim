'use client'

import {useLayoutEffect, useRef, useState} from 'react'
import {Box, Typography} from '@mui/material'
import {resolveFittedFrameMsStatLabel} from '@/app/tools/performance/formatFrameMsStatLabel'

const MONO_LABEL_SX = {
    fontFamily: 'monospace',
    fontSize: '0.68rem',
    lineHeight: 1.35,
}

function measureFittedLabel(peakMs, avgMs, container, measureElement) {
    if (!container || !measureElement) {
        return resolveFittedFrameMsStatLabel(peakMs, avgMs, () => true)
    }

    const fits = (candidate) => {
        measureElement.textContent = candidate
        return measureElement.scrollWidth <= container.clientWidth
    }

    return resolveFittedFrameMsStatLabel(peakMs, avgMs, fits)
}

export default function FrameMsStatChip({peakMs, avgMs}) {
    const containerRef = useRef(null)
    const measureRef = useRef(null)
    const [label, setLabel] = useState(() => resolveFittedFrameMsStatLabel(
        peakMs,
        avgMs,
        () => true,
    ))

    useLayoutEffect(() => {
        const container = containerRef.current
        const measureElement = measureRef.current

        if (!container || !measureElement) {
            return undefined
        }

        const updateLabel = () => {
            const nextLabel = measureFittedLabel(peakMs, avgMs, container, measureElement)
            setLabel((previous) => (previous === nextLabel ? previous : nextLabel))
        }

        updateLabel()

        const resizeObserver = new ResizeObserver(updateLabel)
        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()
        }
    }, [peakMs, avgMs])

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
                    color: 'rgba(255, 255, 255, 0.9)',
                    whiteSpace: 'nowrap',
                }}
            >
                {label}
            </Typography>
        </Box>
    )
}
