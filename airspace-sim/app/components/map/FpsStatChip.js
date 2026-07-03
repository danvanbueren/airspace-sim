'use client'

import {StatChip} from './PerformanceAnalyticsOverlay'

export default function FpsStatChip({lowFps, avgFps}) {
    const formattedValue = `${lowFps.toFixed(1)}/${avgFps.toFixed(1)}`

    return (
        <StatChip
            label='FPS (low/avg)'
            value={formattedValue}
            multiline
        />
    )
}
