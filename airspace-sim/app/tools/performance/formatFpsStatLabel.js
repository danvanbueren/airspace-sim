import {
    formatPeakAvgStatLabel,
    resolveFittedPeakAvgStatLabel,
} from './formatPeakAvgStatLabel.js'

const DEFAULT_FRACTION_DIGITS = 1
const FPS_STAT_LABEL_PREFIX = 'FPS (low/avg)'

export function formatFpsStatLabel(
    lowFps,
    avgFps,
    lowFractionDigits = DEFAULT_FRACTION_DIGITS,
    avgFractionDigits = DEFAULT_FRACTION_DIGITS,
) {
    return formatPeakAvgStatLabel(FPS_STAT_LABEL_PREFIX, lowFps, avgFps, {
        leadingFractionDigits: lowFractionDigits,
        avgFractionDigits,
    })
}

export function resolveFittedFpsStatLabel(lowFps, avgFps, fits) {
    return resolveFittedPeakAvgStatLabel(FPS_STAT_LABEL_PREFIX, lowFps, avgFps, fits, {
        leadingFractionDigits: DEFAULT_FRACTION_DIGITS,
        avgFractionDigits: DEFAULT_FRACTION_DIGITS,
    })
}
