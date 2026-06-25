import {
    PERFORMANCE_FRAME_SEGMENTS,
    PERFORMANCE_HISTORY_LENGTH,
    PERFORMANCE_TARGET_FRAME_MS,
} from './performanceFrameSegments.js'

const SMOOTHING = 0.85

function smooth(previous, next) {
    return (previous * SMOOTHING) + (next * (1 - SMOOTHING))
}

function round(value, digits = 1) {
    if (!Number.isFinite(value)) {
        return 0
    }

    const factor = 10 ** digits

    return Math.round(value * factor) / factor
}

function createEmptyFrameAccumulator() {
    return {
        simTickMs: 0,
        trackSetDataMs: 0,
        sensorSetDataMs: 0,
    }
}

export class PerformanceMonitor {
    constructor() {
        this.enabled = false
        this.listeners = new Set()
        this.windowStartedAt = performance.now()
        this.history = []
        this.currentFrame = createEmptyFrameAccumulator()

        this.smoothed = {
            fps: 60,
            frameMs: PERFORMANCE_TARGET_FRAME_MS,
            simTickMs: 0,
            trackSetDataMs: 0,
            sensorSetDataMs: 0,
        }

        this.counters = {
            simTicks: 0,
            trackSetDataCalls: 0,
            sensorSetDataCalls: 0,
            viewportSyncs: 0,
        }

        this.latest = {
            firmTrackCount: 0,
            visibleTrackCount: 0,
            radarCurrentCount: 0,
            radarHistoryCount: 0,
            iffCurrentCount: 0,
            iffHistoryCount: 0,
            maxActiveFlights: 0,
            mapZoom: null,
            loadFactor: 1,
            adaptiveLevel: 0,
            recentFrameMs: PERFORMANCE_TARGET_FRAME_MS,
            droppedSimulationSteps: 0,
            coalescedUpdates: 0,
            effectiveTrackUpdateHz: 10,
            lastTrackFeatureCount: 0,
            lastVectorFeatureCount: 0,
            lastSensorFeatureCount: 0,
            updatedAt: 0,
        }
    }

    setEnabled(enabled) {
        this.enabled = Boolean(enabled)

        if (this.enabled) {
            this.resetWindow()
            this.history = []
            this.currentFrame = createEmptyFrameAccumulator()
        }
    }

    subscribe(listener) {
        this.listeners.add(listener)

        return () => {
            this.listeners.delete(listener)
        }
    }

    notify() {
        this.listeners.forEach((listener) => listener(this.getMetrics()))
    }

    resetWindow() {
        this.windowStartedAt = performance.now()
        this.counters.simTicks = 0
        this.counters.trackSetDataCalls = 0
        this.counters.sensorSetDataCalls = 0
        this.counters.viewportSyncs = 0
    }

    commitFrame(frameMs) {
        if (!this.enabled || !Number.isFinite(frameMs)) {
            return
        }

        const simTickMs = this.currentFrame.simTickMs
        const trackSetDataMs = this.currentFrame.trackSetDataMs
        const sensorSetDataMs = this.currentFrame.sensorSetDataMs
        const measuredMs = simTickMs + trackSetDataMs + sensorSetDataMs
        const otherMs = Math.max(0, frameMs - Math.min(measuredMs, frameMs))

        this.history.push({
            frameMs,
            simTickMs,
            trackSetDataMs,
            sensorSetDataMs,
            otherMs,
        })

        if (this.history.length > PERFORMANCE_HISTORY_LENGTH) {
            this.history.shift()
        }

        this.currentFrame = createEmptyFrameAccumulator()
        this.smoothed.frameMs = smooth(this.smoothed.frameMs, frameMs)
        this.smoothed.fps = smooth(this.smoothed.fps, 1000 / Math.max(frameMs, 0.001))
        this.latest.updatedAt = performance.now()
        this.notify()
    }

    recordSimTick(durationMs) {
        if (!this.enabled || !Number.isFinite(durationMs)) {
            return
        }

        this.currentFrame.simTickMs += durationMs
        this.smoothed.simTickMs = smooth(this.smoothed.simTickMs, durationMs)
        this.counters.simTicks += 1
        this.latest.updatedAt = performance.now()
    }

    recordTrackSetData(durationMs, {trackFeatures = 0, vectorFeatures = 0} = {}) {
        if (!this.enabled || !Number.isFinite(durationMs)) {
            return
        }

        this.currentFrame.trackSetDataMs += durationMs
        this.smoothed.trackSetDataMs = smooth(this.smoothed.trackSetDataMs, durationMs)
        this.counters.trackSetDataCalls += 1
        this.latest.lastTrackFeatureCount = trackFeatures
        this.latest.lastVectorFeatureCount = vectorFeatures
        this.latest.updatedAt = performance.now()
    }

    recordSensorSetData(durationMs, featureCount = 0) {
        if (!this.enabled || !Number.isFinite(durationMs)) {
            return
        }

        this.currentFrame.sensorSetDataMs += durationMs
        this.smoothed.sensorSetDataMs = smooth(this.smoothed.sensorSetDataMs, durationMs)
        this.counters.sensorSetDataCalls += 1
        this.latest.lastSensorFeatureCount = featureCount
        this.latest.updatedAt = performance.now()
    }

    recordViewportSync(visibleTrackCount, firmTrackCount) {
        if (!this.enabled) {
            return
        }

        this.counters.viewportSyncs += 1
        this.latest.visibleTrackCount = visibleTrackCount
        this.latest.firmTrackCount = firmTrackCount
        this.latest.updatedAt = performance.now()
    }

    updateFromSnapshot(snapshot, {maxActiveFlights, effectiveTrackUpdateHz, mapZoom} = {}) {
        if (!this.enabled || !snapshot) {
            return
        }

        this.latest.firmTrackCount = snapshot.tracks?.length ?? 0
        this.latest.radarCurrentCount = snapshot.radar?.current?.length ?? 0
        this.latest.radarHistoryCount = snapshot.radar?.history?.length ?? 0
        this.latest.iffCurrentCount = snapshot.iff?.current?.length ?? 0
        this.latest.iffHistoryCount = snapshot.iff?.history?.length ?? 0

        if (snapshot.perf) {
            this.latest.loadFactor = snapshot.perf.loadFactor ?? 1
            this.latest.adaptiveLevel = snapshot.perf.adaptiveLevel ?? 0
            this.latest.recentFrameMs = snapshot.perf.recentFrameMs ?? PERFORMANCE_TARGET_FRAME_MS
            this.latest.droppedSimulationSteps = snapshot.perf.droppedSimulationSteps ?? 0
            this.latest.coalescedUpdates = snapshot.perf.coalescedUpdates ?? 0
        }

        if (Number.isFinite(maxActiveFlights)) {
            this.latest.maxActiveFlights = maxActiveFlights
        }

        if (Number.isFinite(effectiveTrackUpdateHz)) {
            this.latest.effectiveTrackUpdateHz = effectiveTrackUpdateHz
        }

        if (Number.isFinite(mapZoom)) {
            this.latest.mapZoom = mapZoom
        }

        this.latest.updatedAt = performance.now()
    }

    getRates() {
        const elapsedMs = Math.max(performance.now() - this.windowStartedAt, 1)
        const elapsedSeconds = elapsedMs / 1000

        return {
            simTicksPerSec: this.counters.simTicks / elapsedSeconds,
            trackSetDataPerSec: this.counters.trackSetDataCalls / elapsedSeconds,
            sensorSetDataPerSec: this.counters.sensorSetDataCalls / elapsedSeconds,
            viewportSyncsPerSec: this.counters.viewportSyncs / elapsedSeconds,
            windowElapsedMs: elapsedMs,
        }
    }

    getHistoryMaxMs() {
        if (this.history.length === 0) {
            return PERFORMANCE_TARGET_FRAME_MS
        }

        const totals = this.history.map((sample) => sample.frameMs)
        const sorted = [...totals].sort((left, right) => left - right)
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? PERFORMANCE_TARGET_FRAME_MS

        return Math.max(PERFORMANCE_TARGET_FRAME_MS, p95, 1)
    }

    getMetrics() {
        const rates = this.getRates()

        return {
            fps: round(this.smoothed.fps, 1),
            frameMs: round(this.smoothed.frameMs, 2),
            simTickMs: round(this.smoothed.simTickMs, 2),
            trackSetDataMs: round(this.smoothed.trackSetDataMs, 2),
            sensorSetDataMs: round(this.smoothed.sensorSetDataMs, 2),
            simTicksPerSec: round(rates.simTicksPerSec, 1),
            trackSetDataPerSec: round(rates.trackSetDataPerSec, 1),
            sensorSetDataPerSec: round(rates.sensorSetDataPerSec, 1),
            viewportSyncsPerSec: round(rates.viewportSyncsPerSec, 1),
            firmTrackCount: this.latest.firmTrackCount,
            visibleTrackCount: this.latest.visibleTrackCount,
            radarCurrentCount: this.latest.radarCurrentCount,
            radarHistoryCount: this.latest.radarHistoryCount,
            iffCurrentCount: this.latest.iffCurrentCount,
            iffHistoryCount: this.latest.iffHistoryCount,
            maxActiveFlights: this.latest.maxActiveFlights,
            mapZoom: this.latest.mapZoom,
            loadFactor: round(this.latest.loadFactor, 2),
            adaptiveLevel: this.latest.adaptiveLevel,
            recentFrameMs: round(this.latest.recentFrameMs, 2),
            droppedSimulationSteps: this.latest.droppedSimulationSteps,
            coalescedUpdates: this.latest.coalescedUpdates,
            effectiveTrackUpdateHz: this.latest.effectiveTrackUpdateHz,
            lastTrackFeatureCount: this.latest.lastTrackFeatureCount,
            lastVectorFeatureCount: this.latest.lastVectorFeatureCount,
            lastSensorFeatureCount: this.latest.lastSensorFeatureCount,
            history: this.history.map((sample) => ({...sample})),
            historyMaxMs: round(this.getHistoryMaxMs(), 2),
            segments: PERFORMANCE_FRAME_SEGMENTS,
            targetFrameMs: PERFORMANCE_TARGET_FRAME_MS,
            updatedAt: this.latest.updatedAt,
        }
    }
}

export function createPerformanceMonitor() {
    return new PerformanceMonitor()
}
