import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {getChartScaleMaxMs} from '../../app/simulation/performanceChartScale.js'
import {
    PERFORMANCE_AVERAGE_MARKER_COLORS,
    getAverageMarkerColor,
} from '../../app/simulation/performanceFrameSegments.js'

describe('performanceChartScale', () => {
    it('uses the configured minimum when history is empty', () => {
        assert.equal(getChartScaleMaxMs([]), 20)
    })

    it('ignores a single extreme spike when computing scale', () => {
        const history = Array.from({length: 29}, () => ({
            frameMs: 16.67,
            maxFrameMs: 18,
            otherMs: 16,
        }))

        history.push({
            frameMs: 16.67,
            maxFrameMs: 420,
            otherMs: 16,
        })

        const scaleMaxMs = getChartScaleMaxMs(history)

        assert.ok(scaleMaxMs < 100)
        assert.ok(scaleMaxMs >= 20)
    })

    it('expands scale when sustained measured compute is above the minimum', () => {
        const history = Array.from({length: 30}, () => ({
            frameMs: 48,
            maxFrameMs: 72,
            simTickMs: 20,
            trackSymbolsSetDataMs: 18,
            trackVectorsSetDataMs: 12,
            maxSimTickMs: 28,
            maxTrackSymbolsSetDataMs: 24,
            maxTrackVectorsSetDataMs: 16,
            otherMs: 28,
        }))

        const scaleMaxMs = getChartScaleMaxMs(history)

        assert.ok(scaleMaxMs >= 50)
    })
})

describe('getAverageMarkerColor', () => {
    it('uses green at or below the 60 fps budget', () => {
        assert.equal(getAverageMarkerColor(16.67), PERFORMANCE_AVERAGE_MARKER_COLORS.withinBudget)
        assert.equal(getAverageMarkerColor(10), PERFORMANCE_AVERAGE_MARKER_COLORS.withinBudget)
    })

    it('uses yellow above the 60 fps budget up to the 50 fps budget', () => {
        assert.equal(getAverageMarkerColor(18), PERFORMANCE_AVERAGE_MARKER_COLORS.warning)
        assert.equal(getAverageMarkerColor(20), PERFORMANCE_AVERAGE_MARKER_COLORS.warning)
    })

    it('uses red above the 50 fps budget', () => {
        assert.equal(getAverageMarkerColor(20.01), PERFORMANCE_AVERAGE_MARKER_COLORS.overBudget)
    })
})
