import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {getChartScaleMaxMs} from '../../app/simulation/performanceChartScale.js'

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
            otherMs: 28,
        }))

        const scaleMaxMs = getChartScaleMaxMs(history)

        assert.ok(scaleMaxMs >= 50)
    })
})
