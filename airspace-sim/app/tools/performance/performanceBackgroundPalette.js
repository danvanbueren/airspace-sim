import {
    PERFORMANCE_50FPS_BUDGET_MS,
    PERFORMANCE_TARGET_FRAME_MS,
} from '../../simulation/performanceFrameSegments.js'

export const PERFORMANCE_HEAT_SMOOTHING_SECONDS = 4
export const PERFORMANCE_HEAT_PEAK_BLEND = 0.15
export const PERFORMANCE_HEAT_TERRIBLE_FRAME_MS = 40
export const PERFORMANCE_BACKGROUND_BLOB_COUNT = 4

const PALETTE_STOPS = [
    {
        heat: 0,
        colors: ['#1a237e', '#311b92', '#0d47a1', '#4a148c'],
    },
    {
        heat: 0.35,
        colors: ['#283593', '#512da8', '#1565c0', '#6a1b9a'],
    },
    {
        heat: 0.55,
        colors: ['#3949ab', '#7b1fa2', '#f9a825', '#8e24aa'],
    },
    {
        heat: 0.75,
        colors: ['#ffb300', '#e65100', '#ff6f00', '#c62828'],
    },
    {
        heat: 1,
        colors: ['#ff5252', '#d32f2f', '#ff1744', '#b71c1c'],
    },
]

const BLOB_DRIFT_CYCLES = [
    {
        periodX: 22,
        periodY: 18,
        amplitudeX: 28,
        amplitudeY: 22,
        phaseX: 0,
        phaseY: 1.2,
    },
    {
        periodX: 26,
        periodY: 20,
        amplitudeX: -24,
        amplitudeY: 26,
        phaseX: 2.1,
        phaseY: 0.4,
    },
    {
        periodX: 19,
        periodY: 24,
        amplitudeX: 20,
        amplitudeY: -20,
        phaseX: 1,
        phaseY: 2.8,
    },
    {
        periodX: 28,
        periodY: 21,
        amplitudeX: -18,
        amplitudeY: 18,
        phaseX: 3.5,
        phaseY: 1.7,
    },
]

export function easeInOutCubic(value) {
    const clamped = Math.max(0, Math.min(1, value))

    if (clamped < 0.5) {
        return 4 * clamped * clamped * clamped
    }

    return 1 - (((-2 * clamped) + 2) ** 3) / 2
}

export function smoothToward(current, target, deltaSeconds, durationSeconds) {
    if (!Number.isFinite(current)) {
        return target
    }

    if (!Number.isFinite(target)) {
        return current
    }

    if (durationSeconds <= 0) {
        return target
    }

    const alpha = 1 - Math.exp(-Math.max(deltaSeconds, 0) / durationSeconds)

    return current + ((target - current) * alpha)
}

export function computePerformanceHeat(
    frameMs,
    peakFrameMs = frameMs,
    {
        targetFrameMs = PERFORMANCE_TARGET_FRAME_MS,
        fiftyFpsBudgetMs = PERFORMANCE_50FPS_BUDGET_MS,
        terribleFrameMs = PERFORMANCE_HEAT_TERRIBLE_FRAME_MS,
        peakBlend = PERFORMANCE_HEAT_PEAK_BLEND,
    } = {},
) {
    const safeFrameMs = Number.isFinite(frameMs) ? frameMs : targetFrameMs
    const safePeakFrameMs = Number.isFinite(peakFrameMs) ? peakFrameMs : safeFrameMs
    const blendedMs = (safeFrameMs * (1 - peakBlend)) + (safePeakFrameMs * peakBlend)

    if (blendedMs <= targetFrameMs) {
        return 0
    }

    if (blendedMs <= fiftyFpsBudgetMs) {
        const normalized = (blendedMs - targetFrameMs) / (fiftyFpsBudgetMs - targetFrameMs)

        return easeInOutCubic(normalized) * 0.55
    }

    if (blendedMs >= terribleFrameMs) {
        return 1
    }

    const normalized = (blendedMs - fiftyFpsBudgetMs) / (terribleFrameMs - fiftyFpsBudgetMs)

    return 0.55 + (easeInOutCubic(normalized) * 0.45)
}

function parseHexColor(hexColor) {
    const normalized = hexColor.replace('#', '')
    const value = Number.parseInt(normalized, 16)

    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    }
}

function interpolateHexColor(startColor, endColor, amount) {
    const start = parseHexColor(startColor)
    const end = parseHexColor(endColor)
    const mix = Math.max(0, Math.min(1, amount))

    return `rgb(${Math.round(start.r + ((end.r - start.r) * mix))}, ${Math.round(start.g + ((end.g - start.g) * mix))}, ${Math.round(start.b + ((end.b - start.b) * mix))})`
}

export function getPaletteForHeat(heat) {
    const clampedHeat = Math.max(0, Math.min(1, heat))

    let lowerStop = PALETTE_STOPS[0]
    let upperStop = PALETTE_STOPS[PALETTE_STOPS.length - 1]

    for (let index = 0; index < PALETTE_STOPS.length - 1; index += 1) {
        const currentStop = PALETTE_STOPS[index]
        const nextStop = PALETTE_STOPS[index + 1]

        if (clampedHeat >= currentStop.heat && clampedHeat <= nextStop.heat) {
            lowerStop = currentStop
            upperStop = nextStop
            break
        }
    }

    const heatRange = upperStop.heat - lowerStop.heat
    const mixAmount = heatRange > 0
        ? easeInOutCubic((clampedHeat - lowerStop.heat) / heatRange)
        : 0

    return lowerStop.colors.map((color, index) => (
        interpolateHexColor(color, upperStop.colors[index], mixAmount)
    ))
}

export function getBlobDrift(elapsedSeconds, blobIndex, reduceMotion = false) {
    if (reduceMotion) {
        return {x: 0, y: 0}
    }

    const cycle = BLOB_DRIFT_CYCLES[blobIndex % BLOB_DRIFT_CYCLES.length]
    const phaseRadiansX = ((2 * Math.PI) * elapsedSeconds) / cycle.periodX
    const phaseRadiansY = ((2 * Math.PI) * elapsedSeconds) / cycle.periodY

    return {
        x: cycle.amplitudeX * Math.sin(phaseRadiansX + cycle.phaseX),
        y: cycle.amplitudeY * Math.sin(phaseRadiansY + cycle.phaseY),
    }
}

export function getPerformanceBackgroundCssVariables(heat, elapsedSeconds, reduceMotion = false) {
    const colors = getPaletteForHeat(heat)
    const variables = {
        '--perf-heat': String(heat),
    }

    for (let index = 0; index < PERFORMANCE_BACKGROUND_BLOB_COUNT; index += 1) {
        const drift = getBlobDrift(elapsedSeconds, index, reduceMotion)

        variables[`--perf-blob-${index}-color`] = colors[index] ?? colors[colors.length - 1]
        variables[`--perf-blob-${index}-x`] = `${drift.x}px`
        variables[`--perf-blob-${index}-y`] = `${drift.y}px`
    }

    return variables
}
