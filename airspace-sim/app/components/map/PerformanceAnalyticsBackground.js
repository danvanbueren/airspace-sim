'use client'

import {Box} from '@mui/material'
import {usePerformanceHeatBackground} from '@/app/hooks/map/usePerformanceHeatBackground'

const BLOB_LAYOUT = [
    {
        top: '-18%',
        left: '-12%',
        size: '58%',
    },
    {
        top: '8%',
        right: '-20%',
        size: '62%',
    },
    {
        bottom: '-22%',
        left: '12%',
        size: '56%',
    },
    {
        bottom: '-8%',
        right: '-10%',
        size: '52%',
    },
]

const INITIAL_BACKGROUND_VARIABLES = {
    '--perf-heat': '0',
    '--perf-blob-0-color': '#1a237e',
    '--perf-blob-0-x': '0px',
    '--perf-blob-0-y': '0px',
    '--perf-blob-1-color': '#311b92',
    '--perf-blob-1-x': '0px',
    '--perf-blob-1-y': '0px',
    '--perf-blob-2-color': '#0d47a1',
    '--perf-blob-2-x': '0px',
    '--perf-blob-2-y': '0px',
    '--perf-blob-3-color': '#4a148c',
    '--perf-blob-3-x': '0px',
    '--perf-blob-3-y': '0px',
}

export default function PerformanceAnalyticsBackground({frameMs, peakFrameMs, enabled}) {
    const {backgroundRef, blobCount} = usePerformanceHeatBackground({
        frameMs,
        peakFrameMs,
        enabled,
    })

    return (
        <Box
            ref={backgroundRef}
            aria-hidden
            sx={{
                ...INITIAL_BACKGROUND_VARIABLES,
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                zIndex: 0,
                contain: 'strict',
                background: 'linear-gradient(160deg, rgba(8, 12, 28, 0.92) 0%, rgba(12, 8, 20, 0.88) 100%)',
            }}
        >
            {BLOB_LAYOUT.slice(0, blobCount).map((layout, index) => (
                <Box
                    key={layout.top + layout.left + layout.right + layout.bottom}
                    sx={{
                        position: 'absolute',
                        width: layout.size,
                        height: layout.size,
                        top: layout.top,
                        left: layout.left,
                        right: layout.right,
                        bottom: layout.bottom,
                        borderRadius: '50%',
                        opacity: 0.48,
                        filter: 'blur(72px)',
                        transform: `translate(var(--perf-blob-${index}-x), var(--perf-blob-${index}-y))`,
                        background: `radial-gradient(circle, var(--perf-blob-${index}-color) 0%, transparent 70%)`,
                        willChange: 'transform',
                    }}
                />
            ))}
        </Box>
    )
}
