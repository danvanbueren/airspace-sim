import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    formatFpsStatLabel,
    resolveFittedFpsStatLabel,
} from '../../app/tools/performance/formatFpsStatLabel.js'
import {
    formatFrameMsStatLabel,
    formatMsValue,
    resolveFittedFrameMsStatLabel,
} from '../../app/tools/performance/formatFrameMsStatLabel.js'

describe('formatFrameMsStatLabel', () => {
    it('formats peak and average values with two decimal places by default', () => {
        assert.equal(formatMsValue(12.345), '12.35')
        assert.equal(formatFrameMsStatLabel(18.5, 12.34), 'Frame (peak/avg): 18.50/12.34 ms')
    })

    it('reduces decimal precision one digit at a time until the label fits', () => {
        const label = resolveFittedFrameMsStatLabel(18.54, 12.34, (candidate) => (
            candidate.length <= 31
        ))

        assert.equal(label, 'Frame (peak/avg): 18.5/12.34 ms')
    })

    it('falls back to integers when fractional digits no longer fit', () => {
        const label = resolveFittedFrameMsStatLabel(1234.56, 78.9, (candidate) => (
            candidate.length <= 28
        ))

        assert.equal(label, 'Frame (peak/avg): 1235/79 ms')
    })
})

describe('formatFpsStatLabel', () => {
    it('formats low and average fps with one decimal place by default', () => {
        assert.equal(formatFpsStatLabel(58.54, 60), 'FPS (low/avg): 58.5/60.0')
    })

    it('reduces decimal precision one digit at a time until the label fits', () => {
        const label = resolveFittedFpsStatLabel(58.54, 60, (candidate) => (
            candidate.length <= 22
        ))

        assert.equal(label, 'FPS (low/avg): 59/60.0')
    })
})
