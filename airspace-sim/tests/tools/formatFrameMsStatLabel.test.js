import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    formatFrameMsStatLabel,
    formatMsValue,
    resolveFittedFrameMsStatLabel,
} from '../../app/tools/performance/formatFrameMsStatLabel.js'

describe('formatFrameMsStatLabel', () => {
    it('formats peak and average values with two decimal places by default', () => {
        assert.equal(formatMsValue(12.345), '12.35')
        assert.equal(formatFrameMsStatLabel(18.5, 12.34), 'Frame (ms): 18.50/12.34')
    })

    it('reduces decimal precision one digit at a time until the label fits', () => {
        const label = resolveFittedFrameMsStatLabel(18.54, 12.34, (candidate) => (
            candidate.length <= 22
        ))

        assert.equal(label, 'Frame (ms): 18.5/12.34')
    })

    it('falls back to integers when fractional digits no longer fit', () => {
        const label = resolveFittedFrameMsStatLabel(1234.56, 78.9, (candidate) => (
            candidate.length <= 18
        ))

        assert.equal(label, 'Frame (ms): 1235/79')
    })
})
