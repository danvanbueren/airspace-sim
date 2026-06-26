import {
    formatNumericValue,
    formatPeakAvgStatLabel,
    resolveFittedPeakAvgStatLabel,
} from './formatPeakAvgStatLabel.js'

const DEFAULT_FRACTION_DIGITS = 2
const FRAME_STAT_LABEL_PREFIX = 'Frame (peak/avg)'

export {formatNumericValue as formatMsValue}

export function formatFrameMsStatLabel(
    peakMs,
    avgMs,
    peakFractionDigits = DEFAULT_FRACTION_DIGITS,
    avgFractionDigits = DEFAULT_FRACTION_DIGITS,
) {
    return formatPeakAvgStatLabel(FRAME_STAT_LABEL_PREFIX, peakMs, avgMs, {
        suffix: 'ms',
        leadingFractionDigits: peakFractionDigits,
        avgFractionDigits,
    })
}

export function resolveFittedFrameMsStatLabel(peakMs, avgMs, fits) {
    return resolveFittedPeakAvgStatLabel(FRAME_STAT_LABEL_PREFIX, peakMs, avgMs, fits, {
        suffix: 'ms',
        leadingFractionDigits: DEFAULT_FRACTION_DIGITS,
        avgFractionDigits: DEFAULT_FRACTION_DIGITS,
    })
}
