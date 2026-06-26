'use client'

import {resolveFittedFrameMsStatLabel} from '@/app/tools/performance/formatFrameMsStatLabel'
import PeakAvgStatChip from './PeakAvgStatChip'

export default function FrameMsStatChip({peakMs, avgMs}) {
    return (
        <PeakAvgStatChip
            leadingValue={peakMs}
            avgValue={avgMs}
            resolveLabel={resolveFittedFrameMsStatLabel}
        />
    )
}
