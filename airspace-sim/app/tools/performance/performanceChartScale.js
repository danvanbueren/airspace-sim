import {
    PERFORMANCE_MEASURED_FRAME_SEGMENTS,
    PERFORMANCE_TARGET_FRAME_MS,
    PERFORMANCE_Y_AXIS_MIN_MS,
} from './performanceFrameSegments.js'

/** Fraction of history samples used for Y-axis scaling (ignores rare tail spikes). */
export const PERFORMANCE_CHART_SCALE_PERCENTILE = 0.95

export function getSampleMeasuredMs(sample) {
    return PERFORMANCE_MEASURED_FRAME_SEGMENTS.reduce(
        (sum, segment) => sum + (sample[segment.key] ?? 0),
        0,
    )
}

export function getSampleMaxMeasuredMs(sample) {
    return PERFORMANCE_MEASURED_FRAME_SEGMENTS.reduce(
        (sum, segment) => sum + (sample[segment.maxKey] ?? 0),
        0,
    )
}

export function getSamplePeakMs(sample) {
    return Math.max(
        sample.maxMeasuredMs ?? 0,
        getSampleMaxMeasuredMs(sample),
    )
}

/**
 * Y-axis maximum for the performance chart.
 * Uses a high percentile of recent measured compute so a single spike does not
 * compress the entire scale; peaks above this still render clamped at the top edge.
 */
export function getChartScaleMaxMs(history, targetFrameMs = PERFORMANCE_TARGET_FRAME_MS) {
    const minScaleMs = Math.max(PERFORMANCE_Y_AXIS_MIN_MS, targetFrameMs)

    if (!history?.length) {
        return minScaleMs
    }

    const peaks = history
        .map((sample) => getSampleMaxMeasuredMs(sample))
        .filter((value) => Number.isFinite(value) && value > 0)
        .sort((left, right) => left - right)

    if (peaks.length === 0) {
        return minScaleMs
    }

    const percentileIndex = Math.min(
        peaks.length - 1,
        Math.floor(peaks.length * PERFORMANCE_CHART_SCALE_PERCENTILE),
    )
    const percentilePeakMs = peaks[percentileIndex] ?? minScaleMs

    return Math.max(minScaleMs, percentilePeakMs)
}

export function msToPlotY(ms, {plotTop, plotHeight, scaleMaxMs}) {
    const clampedMs = Math.max(0, Math.min(ms, scaleMaxMs))
    return plotTop + plotHeight - (clampedMs / scaleMaxMs) * plotHeight
}
