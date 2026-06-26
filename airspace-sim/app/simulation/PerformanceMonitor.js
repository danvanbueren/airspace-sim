import {getSampleMaxMeasuredMs, getSampleMeasuredMs} from './performanceChartScale.js'
import {
    PERFORMANCE_MEASURED_FRAME_SEGMENTS,
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
        trackSymbolsSetDataMs: 0,
        trackVectorsSetDataMs: 0,
        sensorRadarSetDataMs: 0,
        sensorIffSetDataMs: 0,
        viewportSyncMs: 0,
    }
}

function createEmptyBucketAccumulator() {
    return {
        frameCount: 0,
        frameMsSum: 0,
        maxFrameMs: 0,
        maxMeasuredMs: 0,
        simTickMsSum: 0,
        trackSymbolsSetDataMsSum: 0,
        trackVectorsSetDataMsSum: 0,
        sensorRadarSetDataMsSum: 0,
        sensorIffSetDataMsSum: 0,
        viewportSyncMsSum: 0,
        maxSimTickMs: 0,
        maxTrackSymbolsSetDataMs: 0,
        maxTrackVectorsSetDataMs: 0,
        maxSensorRadarSetDataMs: 0,
        maxSensorIffSetDataMs: 0,
        maxViewportSyncMs: 0,
    }
}

function getMeasuredFrameMs(frame) {
    return (
        frame.simTickMs
        + frame.trackSymbolsSetDataMs
        + frame.trackVectorsSetDataMs
        + frame.sensorRadarSetDataMs
        + frame.sensorIffSetDataMs
        + frame.viewportSyncMs
    )
}

function getBucketMeasuredMsSum(bucket) {
    return (
        bucket.simTickMsSum
        + bucket.trackSymbolsSetDataMsSum
        + bucket.trackVectorsSetDataMsSum
        + bucket.sensorRadarSetDataMsSum
        + bucket.sensorIffSetDataMsSum
        + bucket.viewportSyncMsSum
    )
}

function averageBucketValue(sum, count) {
    return count > 0 ? sum / count : 0
}

function addFrameMeasurementsToBucket(bucket, frame) {
    bucket.simTickMsSum += frame.simTickMs
    bucket.trackSymbolsSetDataMsSum += frame.trackSymbolsSetDataMs
    bucket.trackVectorsSetDataMsSum += frame.trackVectorsSetDataMs
    bucket.sensorRadarSetDataMsSum += frame.sensorRadarSetDataMs
    bucket.sensorIffSetDataMsSum += frame.sensorIffSetDataMs
    bucket.viewportSyncMsSum += frame.viewportSyncMs
    bucket.maxSimTickMs = Math.max(bucket.maxSimTickMs, frame.simTickMs)
    bucket.maxTrackSymbolsSetDataMs = Math.max(
        bucket.maxTrackSymbolsSetDataMs,
        frame.trackSymbolsSetDataMs,
    )
    bucket.maxTrackVectorsSetDataMs = Math.max(
        bucket.maxTrackVectorsSetDataMs,
        frame.trackVectorsSetDataMs,
    )
    bucket.maxSensorRadarSetDataMs = Math.max(
        bucket.maxSensorRadarSetDataMs,
        frame.sensorRadarSetDataMs,
    )
    bucket.maxSensorIffSetDataMs = Math.max(bucket.maxSensorIffSetDataMs, frame.sensorIffSetDataMs)
    bucket.maxViewportSyncMs = Math.max(bucket.maxViewportSyncMs, frame.viewportSyncMs)
}

export class PerformanceMonitor {
    constructor() {
        this.enabled = false
        this.listeners = new Set()
        this.windowStartedAt = performance.now()
        this.history = []
        this.currentFrame = createEmptyFrameAccumulator()
        this.currentBucket = createEmptyBucketAccumulator()

        this.smoothed = {
            fps: 60,
            frameMs: 0,
            simTickMs: 0,
            trackSymbolsSetDataMs: 0,
            trackVectorsSetDataMs: 0,
            sensorRadarSetDataMs: 0,
            sensorIffSetDataMs: 0,
            viewportSyncMs: 0,
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
            this.currentBucket = createEmptyBucketAccumulator()
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

    absorbStrayMeasurements() {
        if (!this.enabled || getMeasuredFrameMs(this.currentFrame) <= 0) {
            return
        }

        const measuredMs = getMeasuredFrameMs(this.currentFrame)
        const bucket = this.currentBucket

        addFrameMeasurementsToBucket(bucket, this.currentFrame)
        bucket.maxMeasuredMs = Math.max(bucket.maxMeasuredMs, measuredMs)
        this.currentFrame = createEmptyFrameAccumulator()
        this.latest.updatedAt = performance.now()
    }

    commitFrame(frameMs) {
        if (!this.enabled || !Number.isFinite(frameMs)) {
            return
        }

        const frame = this.currentFrame
        const measuredMs = getMeasuredFrameMs(frame)
        const bucket = this.currentBucket

        addFrameMeasurementsToBucket(bucket, frame)
        bucket.frameCount += 1
        bucket.frameMsSum += frameMs
        bucket.maxFrameMs = Math.max(bucket.maxFrameMs, frameMs)
        bucket.maxMeasuredMs = Math.max(bucket.maxMeasuredMs, measuredMs)

        this.currentFrame = createEmptyFrameAccumulator()
        this.smoothed.frameMs = smooth(this.smoothed.frameMs, measuredMs)
        this.smoothed.fps = smooth(this.smoothed.fps, 1000 / Math.max(frameMs, 0.001))
        this.latest.updatedAt = performance.now()
    }

    flushBucket() {
        if (!this.enabled) {
            return
        }

        this.absorbStrayMeasurements()

        const bucket = this.currentBucket

        if (bucket.frameCount > 0) {
            const count = bucket.frameCount
            const totalMeasuredMs = getBucketMeasuredMsSum(bucket)
            const otherTotalMs = Math.max(0, bucket.frameMsSum - totalMeasuredMs)

            this.history.push({
                frameMs: averageBucketValue(bucket.frameMsSum, count),
                maxFrameMs: bucket.maxFrameMs,
                maxMeasuredMs: bucket.maxMeasuredMs,
                avgMeasuredMs: averageBucketValue(totalMeasuredMs, count),
                simTickMs: averageBucketValue(bucket.simTickMsSum, count),
                trackSymbolsSetDataMs: averageBucketValue(bucket.trackSymbolsSetDataMsSum, count),
                trackVectorsSetDataMs: averageBucketValue(bucket.trackVectorsSetDataMsSum, count),
                sensorRadarSetDataMs: averageBucketValue(bucket.sensorRadarSetDataMsSum, count),
                sensorIffSetDataMs: averageBucketValue(bucket.sensorIffSetDataMsSum, count),
                viewportSyncMs: averageBucketValue(bucket.viewportSyncMsSum, count),
                maxSimTickMs: bucket.maxSimTickMs,
                maxTrackSymbolsSetDataMs: bucket.maxTrackSymbolsSetDataMs,
                maxTrackVectorsSetDataMs: bucket.maxTrackVectorsSetDataMs,
                maxSensorRadarSetDataMs: bucket.maxSensorRadarSetDataMs,
                maxSensorIffSetDataMs: bucket.maxSensorIffSetDataMs,
                maxViewportSyncMs: bucket.maxViewportSyncMs,
                otherMs: averageBucketValue(otherTotalMs, count),
                frameCount: count,
            })

            if (this.history.length > PERFORMANCE_HISTORY_LENGTH) {
                this.history.shift()
            }
        }

        this.currentBucket = createEmptyBucketAccumulator()
        this.latest.updatedAt = performance.now()
        this.notify()
    }

    recordSimTick(durationMs) {
        if (!this.enabled || !Number.isFinite(durationMs) || durationMs < 0) {
            return
        }

        this.currentFrame.simTickMs += durationMs
        this.smoothed.simTickMs = smooth(this.smoothed.simTickMs, durationMs)
        this.counters.simTicks += 1
        this.latest.updatedAt = performance.now()
    }

    recordTrackSetData({
        trackSymbolsMs = 0,
        trackVectorsMs = 0,
        trackFeatures = 0,
        vectorFeatures = 0,
    } = {}) {
        if (!this.enabled) {
            return
        }

        if (Number.isFinite(trackSymbolsMs) && trackSymbolsMs >= 0) {
            this.currentFrame.trackSymbolsSetDataMs += trackSymbolsMs
            this.smoothed.trackSymbolsSetDataMs = smooth(this.smoothed.trackSymbolsSetDataMs, trackSymbolsMs)
        }

        if (Number.isFinite(trackVectorsMs) && trackVectorsMs >= 0) {
            this.currentFrame.trackVectorsSetDataMs += trackVectorsMs
            this.smoothed.trackVectorsSetDataMs = smooth(this.smoothed.trackVectorsSetDataMs, trackVectorsMs)
        }

        this.counters.trackSetDataCalls += 1
        this.latest.lastTrackFeatureCount = trackFeatures
        this.latest.lastVectorFeatureCount = vectorFeatures
        this.latest.updatedAt = performance.now()
    }

    recordSensorSetData({radarMs = 0, iffMs = 0, featureCount = 0} = {}) {
        if (!this.enabled) {
            return
        }

        if (Number.isFinite(radarMs) && radarMs >= 0) {
            this.currentFrame.sensorRadarSetDataMs += radarMs
            this.smoothed.sensorRadarSetDataMs = smooth(this.smoothed.sensorRadarSetDataMs, radarMs)
        }

        if (Number.isFinite(iffMs) && iffMs >= 0) {
            this.currentFrame.sensorIffSetDataMs += iffMs
            this.smoothed.sensorIffSetDataMs = smooth(this.smoothed.sensorIffSetDataMs, iffMs)
        }

        this.counters.sensorSetDataCalls += 1
        this.latest.lastSensorFeatureCount = featureCount
        this.latest.updatedAt = performance.now()
    }

    recordViewportSync(visibleTrackCount, firmTrackCount, durationMs = 0) {
        if (!this.enabled) {
            return
        }

        this.counters.viewportSyncs += 1
        this.latest.visibleTrackCount = visibleTrackCount
        this.latest.firmTrackCount = firmTrackCount

        if (Number.isFinite(durationMs) && durationMs >= 0) {
            this.currentFrame.viewportSyncMs += durationMs
            this.smoothed.viewportSyncMs = smooth(this.smoothed.viewportSyncMs, durationMs)
        }

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

        const totals = this.history.map((sample) => Math.max(
            getSampleMaxMeasuredMs(sample),
            sample.maxMeasuredMs ?? 0,
        ))
        const sorted = [...totals].sort((left, right) => left - right)
        const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? PERFORMANCE_TARGET_FRAME_MS

        return Math.max(PERFORMANCE_TARGET_FRAME_MS, p95, 1)
    }

    getLivePeakMeasuredMs() {
        const inFlightMeasuredMs = getMeasuredFrameMs(this.currentFrame)

        return Math.max(this.currentBucket.maxMeasuredMs, inFlightMeasuredMs)
    }

    getMetrics() {
        const rates = this.getRates()

        return {
            fps: round(this.smoothed.fps, 1),
            frameMs: round(this.smoothed.frameMs, 2),
            peakFrameMs: round(this.getLivePeakMeasuredMs(), 2),
            simTickMs: round(this.smoothed.simTickMs, 2),
            trackSymbolsSetDataMs: round(this.smoothed.trackSymbolsSetDataMs, 2),
            trackVectorsSetDataMs: round(this.smoothed.trackVectorsSetDataMs, 2),
            sensorRadarSetDataMs: round(this.smoothed.sensorRadarSetDataMs, 2),
            sensorIffSetDataMs: round(this.smoothed.sensorIffSetDataMs, 2),
            viewportSyncMs: round(this.smoothed.viewportSyncMs, 2),
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
            segments: PERFORMANCE_MEASURED_FRAME_SEGMENTS,
            targetFrameMs: PERFORMANCE_TARGET_FRAME_MS,
            updatedAt: this.latest.updatedAt,
        }
    }
}

export function createPerformanceMonitor() {
    return new PerformanceMonitor()
}
