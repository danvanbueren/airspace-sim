import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    getBoundedTrackDeltaSeconds,
    MAX_TRACK_DELTA_SECONDS,
} from '../../app/simulation/trackTiming.js'

describe('getBoundedTrackDeltaSeconds', () => {
    it('returns zero before the first previous timestamp is recorded', () => {
        assert.equal(getBoundedTrackDeltaSeconds(10_000, 0), 0)
    })

    it('returns the elapsed seconds for normal frame-to-frame deltas', () => {
        assert.equal(getBoundedTrackDeltaSeconds(10_150, 10_000), 0.15)
    })

    it('ignores negative deltas from clock skew', () => {
        assert.equal(getBoundedTrackDeltaSeconds(9_000, 10_000), 0)
    })

    it('caps long wall-clock gaps instead of replaying all missed time', () => {
        assert.equal(
            getBoundedTrackDeltaSeconds(3_610_000, 10_000),
            MAX_TRACK_DELTA_SECONDS,
        )
    })
})
