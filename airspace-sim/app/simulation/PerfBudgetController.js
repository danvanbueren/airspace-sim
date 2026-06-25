import {QUALITY_PRESETS, QUALITY_PRESET_CUSTOM} from './constants'

const TARGET_FRAME_MS = 16.67
const SMOOTHING = 0.85

export class PerfBudgetController {
    constructor() {
        this.enabled = true
        this.recentFrameMs = TARGET_FRAME_MS
        this.loadFactor = 1
        this.stats = {
            coalescedUpdates: 0,
            droppedSimulationSteps: 0,
            adaptiveLevel: 0,
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled
    }

    recordFrame(durationMs) {
        this.recentFrameMs = (this.recentFrameMs * SMOOTHING) + (durationMs * (1 - SMOOTHING))
        this.updateLoadFactor()
    }

    updateLoadFactor() {
        if (!this.enabled) {
            this.loadFactor = 1
            this.stats.adaptiveLevel = 0
            return
        }

        const ratio = this.recentFrameMs / TARGET_FRAME_MS

        if (ratio > 1.8) {
            this.loadFactor = 0.45
            this.stats.adaptiveLevel = 3
        } else if (ratio > 1.35) {
            this.loadFactor = 0.65
            this.stats.adaptiveLevel = 2
        } else if (ratio > 1.1) {
            this.loadFactor = 0.85
            this.stats.adaptiveLevel = 1
        } else {
            this.loadFactor = 1
            this.stats.adaptiveLevel = 0
        }
    }

    shouldCoalesceUpdates() {
        if (this.loadFactor < 0.7) {
            this.stats.coalescedUpdates += 1
            return true
        }

        return false
    }

    shouldSkipSimulationStep() {
        if (this.loadFactor < 0.35) {
            this.stats.droppedSimulationSteps += 1
            return true
        }

        return false
    }

    getEffectiveTrackUpdateHz(baseHz) {
        return Math.max(2, Math.round(baseHz * this.loadFactor))
    }

    getEffectiveMaxAircraft(baseMax, qualityPreset) {
        if (qualityPreset === QUALITY_PRESET_CUSTOM) {
            return Math.max(10, Math.round(baseMax))
        }

        const preset = QUALITY_PRESETS[qualityPreset] ?? QUALITY_PRESETS.balanced
        const presetMax = preset.maxActiveFlights
            ?? preset.maxTruthAircraftInViewport
            ?? baseMax

        return Math.max(10, Math.round(Math.min(baseMax, presetMax)))
    }

    getStats() {
        return {
            ...this.stats,
            recentFrameMs: this.recentFrameMs,
            loadFactor: this.loadFactor,
        }
    }
}
