import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    bearingRangeBehaviorUsesPersistModifier,
    normalizeBearingRangeBehavior,
    shouldPersistBearingRangeLine,
} from '../../app/tools/map/bearingRangeBehavior.js'

describe('bearingRangeBehavior', () => {
    it('normalizes unknown values to temporary_default', () => {
        assert.equal(normalizeBearingRangeBehavior('invalid'), 'temporary_default')
        assert.equal(normalizeBearingRangeBehavior('permanent_default'), 'permanent_default')
    })

    it('persists only when modifier is active in temporary_default mode', () => {
        assert.equal(shouldPersistBearingRangeLine('temporary_default', true), true)
        assert.equal(shouldPersistBearingRangeLine('temporary_default', false), false)
    })

    it('persists unless modifier is active in permanent_default mode', () => {
        assert.equal(shouldPersistBearingRangeLine('permanent_default', true), false)
        assert.equal(shouldPersistBearingRangeLine('permanent_default', false), true)
    })

    it('always or never persists in fixed modes', () => {
        assert.equal(shouldPersistBearingRangeLine('always_permanent', false), true)
        assert.equal(shouldPersistBearingRangeLine('never_permanent', true), false)
    })

    it('tracks which modes honor the persist modifier', () => {
        assert.equal(bearingRangeBehaviorUsesPersistModifier('temporary_default'), true)
        assert.equal(bearingRangeBehaviorUsesPersistModifier('permanent_default'), true)
        assert.equal(bearingRangeBehaviorUsesPersistModifier('always_permanent'), false)
        assert.equal(bearingRangeBehaviorUsesPersistModifier('never_permanent'), false)
    })
})
