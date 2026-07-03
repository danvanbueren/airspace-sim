'use client'

import {StatChip} from './PerformanceAnalyticsOverlay'

export default function FrameMsStatChip({peakMs, avgMs}) {
    const formattedValue = `${peakMs.toFixed(2)}/${avgMs.toFixed(2)} ms`

    return (
        <StatChip
            label='Frame (peak/avg)'
            value={formattedValue}
            multiline
        />
    )
}
