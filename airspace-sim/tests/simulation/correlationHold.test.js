import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    USER_CORRELATION_HOLD_MS,
    applyUserKinematicEditHold,
    getCorrelationHoldUntil,
    hasKinematicOrPositionEdit,
    isCorrelationHoldActive,
    resolveExpiredCorrelationHold,
} from '../../app/simulation/correlationHold.js'

describe('correlation hold', () => {
    it('detects kinematic and position edit fields', () => {
        assert.equal(hasKinematicOrPositionEdit(['callsign']), false)
        assert.equal(hasKinematicOrPositionEdit(['heading', 'callsign']), true)
        assert.equal(hasKinematicOrPositionEdit(['longitude']), true)
    })

    it('starts a hold when kinematic fields are committed', () => {
        const now = 1_000_000
        const updated = applyUserKinematicEditHold(
            {heading: 90},
            null,
            ['heading'],
            now,
        )

        assert.equal(updated.lastUserKinematicEditAt, now)
        assert.deepEqual(updated.lastUserKinematicEditFields, ['heading'])
        assert.equal(isCorrelationHoldActive(updated, now + 1_000), true)
        assert.equal(isCorrelationHoldActive(updated, now + USER_CORRELATION_HOLD_MS), false)
    })

    it('does not start a hold for metadata-only edits', () => {
        const updated = applyUserKinematicEditHold(
            {callsign: 'VIP01'},
            null,
            ['callsign'],
            1_000_000,
        )

        assert.equal(updated.lastUserKinematicEditAt, undefined)
        assert.equal(updated.lastUserKinematicEditFields, undefined)
    })

    it('clears kinematic management skip fields after the hold expires', () => {
        const now = 2_000_000
        const track = {
            heading: 90,
            lastUserKinematicEditAt: now,
            lastUserKinematicEditFields: ['heading'],
            lastManagementEditFields: ['heading', 'callsign'],
        }

        const resolved = resolveExpiredCorrelationHold(track, now + USER_CORRELATION_HOLD_MS + 1)

        assert.deepEqual(resolved.lastManagementEditFields, ['callsign'])
        assert.equal(resolved.lastUserKinematicEditAt, undefined)
        assert.equal(resolved.lastUserKinematicEditFields, undefined)
        assert.equal(getCorrelationHoldUntil(resolved), 0)
    })

    it('clears stale kinematic management fields even without hold timestamps', () => {
        const track = {
            heading: 90,
            lastManagementEditFields: ['heading', 'callsign'],
        }

        const resolved = resolveExpiredCorrelationHold(track)

        assert.deepEqual(resolved.lastManagementEditFields, ['callsign'])
    })
})
