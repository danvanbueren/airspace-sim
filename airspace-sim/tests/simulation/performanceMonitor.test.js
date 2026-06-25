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

    it('records per-frame history samples for stacked charts when enabled', () => {
        const monitor = new PerformanceMonitor()
        monitor.setEnabled(true)

        monitor.recordSimTick(8)
        monitor.recordTrackSetData(3, {trackFeatures: 10, vectorFeatures: 10})
        monitor.recordSensorSetData(2, 40)
        monitor.commitFrame(20)

        monitor.recordSimTick(4)
        monitor.commitFrame(12)

        const metrics = monitor.getMetrics()

        assert.equal(metrics.history.length, 2)
        assert.equal(metrics.history[0].simTickMs, 8)
        assert.equal(metrics.history[0].trackSetDataMs, 3)
        assert.equal(metrics.history[0].sensorSetDataMs, 2)
        assert.equal(metrics.history[0].otherMs, 7)
        assert.equal(metrics.history[1].simTickMs, 4)
        assert.equal(metrics.history[1].otherMs, 8)
        assert.ok(metrics.historyMaxMs >= 16.67)
        assert.equal(metrics.segments.length, 4)
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
