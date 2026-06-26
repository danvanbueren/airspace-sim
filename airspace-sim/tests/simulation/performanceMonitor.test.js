import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {PerformanceMonitor} from '../../app/simulation/PerformanceMonitor.js'

describe('PerformanceMonitor', () => {
    it('does not record metrics while disabled', () => {
        const monitor = new PerformanceMonitor()

        monitor.commitFrame(40)
        monitor.recordSimTick(25)

        const metrics = monitor.getMetrics()

        assert.equal(metrics.fps, 60)
        assert.equal(metrics.simTickMs, 0)
        assert.equal(metrics.history.length, 0)
    })

    it('aggregates per-frame samples into averaged and peak history buckets when enabled', () => {
        const monitor = new PerformanceMonitor()
        monitor.setEnabled(true)

        monitor.recordSimTick(8)
        monitor.recordTrackSetData({
            trackSymbolsMs: 2,
            trackVectorsMs: 1,
            trackFeatures: 10,
            vectorFeatures: 10,
        })
        monitor.recordSensorSetData({radarMs: 1.5, iffMs: 0.5, featureCount: 40})
        monitor.recordViewportSync(12, 20, 1)
        monitor.commitFrame(20)

        monitor.recordSimTick(4)
        monitor.commitFrame(12)

        monitor.flushBucket()

        const metrics = monitor.getMetrics()

        assert.equal(metrics.history.length, 1)
        assert.equal(metrics.history[0].simTickMs, 6)
        assert.equal(metrics.history[0].trackSymbolsSetDataMs, 1)
        assert.equal(metrics.history[0].trackVectorsSetDataMs, 0.5)
        assert.equal(metrics.history[0].sensorRadarSetDataMs, 0.75)
        assert.equal(metrics.history[0].sensorIffSetDataMs, 0.25)
        assert.equal(metrics.history[0].viewportSyncMs, 0.5)
        assert.equal(metrics.history[0].maxSimTickMs, 8)
        assert.equal(metrics.history[0].maxTrackSymbolsSetDataMs, 2)
        assert.equal(metrics.history[0].maxTrackVectorsSetDataMs, 1)
        assert.equal(metrics.history[0].maxSensorRadarSetDataMs, 1.5)
        assert.equal(metrics.history[0].maxSensorIffSetDataMs, 0.5)
        assert.equal(metrics.history[0].maxViewportSyncMs, 1)
        assert.equal(metrics.history[0].avgMeasuredMs, 9)
        assert.equal(metrics.history[0].frameMs, 16)
        assert.equal(metrics.history[0].maxFrameMs, 20)
        assert.equal(metrics.history[0].maxMeasuredMs, 14)
        assert.equal(metrics.history[0].otherMs, 7)
        assert.equal(metrics.history[0].frameCount, 2)
        assert.ok(metrics.historyMaxMs >= 16.67)
        assert.equal(metrics.segments.length, 6)
    })

    it('absorbs stray measurements recorded after the last frame commit', () => {
        const monitor = new PerformanceMonitor()
        monitor.setEnabled(true)

        monitor.commitFrame(16.67)
        monitor.recordSimTick(6)
        monitor.recordTrackSetData({trackSymbolsMs: 1.5, trackVectorsMs: 0.5})
        monitor.flushBucket()

        const metrics = monitor.getMetrics()

        assert.equal(metrics.history.length, 1)
        assert.equal(metrics.history[0].frameCount, 1)
        assert.equal(metrics.history[0].simTickMs, 6)
        assert.equal(metrics.history[0].trackSymbolsSetDataMs, 1.5)
        assert.equal(metrics.history[0].trackVectorsSetDataMs, 0.5)
        assert.ok(Math.abs(metrics.history[0].otherMs - 8.67) < 0.01)
    })

    it('tracks measured compute in frameMs, not display refresh interval', () => {
        const monitor = new PerformanceMonitor()
        monitor.setEnabled(true)

        for (let index = 0; index < 10; index += 1) {
            monitor.recordSimTick(5)
            monitor.commitFrame(index % 2 === 0 ? 8.33 : 16.67)
        }

        const metrics = monitor.getMetrics()

        assert.ok(metrics.fps > 55)
        assert.ok(metrics.frameMs > 4)
        assert.ok(metrics.frameMs < 6)
        assert.equal(metrics.peakFrameMs, 5)
        assert.ok(metrics.lowFps < metrics.fps)
        assert.ok(Math.abs(metrics.lowFps - 59.9) < 0.2)
    })

    it('tracks smoothed metrics and snapshot fields', () => {
        const monitor = new PerformanceMonitor()
        monitor.setEnabled(true)

        for (let index = 0; index < 10; index += 1) {
            monitor.recordSimTick(10)
            monitor.commitFrame(18)
        }

        monitor.updateFromSnapshot({
            tracks: [{id: 'A'}, {id: 'B'}],
            radar: {current: [1], history: []},
            iff: {current: [], history: [1, 2]},
            perf: {
                loadFactor: 0.65,
                adaptiveLevel: 2,
                recentFrameMs: 28,
                droppedSimulationSteps: 3,
                coalescedUpdates: 0,
            },
        }, {
            maxActiveFlights: 800,
            effectiveTrackUpdateHz: 7,
            mapZoom: 6.5,
        })

        const metrics = monitor.getMetrics()

        assert.ok(metrics.simTickMs > 0)
        assert.equal(metrics.firmTrackCount, 2)
        assert.equal(metrics.maxActiveFlights, 800)
        assert.equal(metrics.mapZoom, 6.5)
        assert.equal(metrics.loadFactor, 0.65)
        assert.equal(metrics.adaptiveLevel, 2)
    })
})
