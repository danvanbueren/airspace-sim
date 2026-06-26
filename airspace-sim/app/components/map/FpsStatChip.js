'use client'

import {resolveFittedFpsStatLabel} from '@/app/tools/performance/formatFpsStatLabel'
import PeakAvgStatChip from './PeakAvgStatChip'

export default function FpsStatChip({lowFps, avgFps}) {
    return (
        <PeakAvgStatChip
            leadingValue={lowFps}
            avgValue={avgFps}
            resolveLabel={resolveFittedFpsStatLabel}
        />
    )
}
