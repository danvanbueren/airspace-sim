import {describe, it} from 'node:test'
import assert from 'node:assert/strict'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {
    AUTO_DROP_REMOVE_DELAY_MS,
    AUTO_DROP_RISK_DELAY_MS,
    getAutoDropProgressUpdates,
    isTrackEligibleForAutoDrop,
    isTrackInAutoDropPhase,
    processAutoDropTracks,
    shouldAutoDropTrack,
    shouldShowDropAttention,
} from '../../app/simulation/trackAutoDrop.js'
import {deriveAttentionFlagsFromTrackState} from '../../app/simulation/trackAttentionFlags.js'

function createTrack(overrides = {}) {
    return {
        id: 'TRK-test',
        trackId: 'TRK-test',
        longitude: -77.5,
        latitude: 39.2,
        heading: 90,
        speed: 400,
        altitude: 30000,
        lastSensorUpdateAt: 0,
        lastExtrapolationAt: 0,
        stale: false,
        domain: 'air',
        identity: 'pending',
        type: '01:110104',
        callsign: 'TEST01',
        correlated: false,
        ...overrides,
    }
}

describe('trackAutoDrop', () => {
    it('identifies uncorrelated tracks without drop protect as eligible', () => {
        assert.equal(isTrackEligibleForAutoDrop(createTrack()), true)
        assert.equal(isTrackEligibleForAutoDrop(createTrack({source: 'manual'})), true)
        assert.equal(isTrackEligibleForAutoDrop(createTrack({correlated: true})), false)
        assert.equal(isTrackEligibleForAutoDrop(createTrack({dropProtect: true})), false)
    })

    it('starts auto-drop countdown for manually initiated tracks', () => {
        const updates = getAutoDropProgressUpdates(createTrack({source: 'manual'}), 1000)

        assert.deepEqual(updates, {dropRiskAt: 1000})
    })

    it('starts invisible DROP-RISK countdown for eligible tracks', () => {
        const updates = getAutoDropProgressUpdates(createTrack(), 1000)

        assert.deepEqual(updates, {dropRiskAt: 1000})
    })

    it('enters visible DROP phase after five seconds', () => {
        const updates = getAutoDropProgressUpdates(
            createTrack({dropRiskAt: 1000}),
            1000 + AUTO_DROP_RISK_DELAY_MS,
        )

        assert.deepEqual(updates, {dropAt: 6000})
        assert.equal(isTrackInAutoDropPhase(createTrack({dropAt: 6000})), true)
    })

    it('removes tracks ten seconds after DROP phase begins', () => {
        const track = createTrack({dropAt: 1000})

        assert.equal(shouldAutoDropTrack(track, 1000 + AUTO_DROP_REMOVE_DELAY_MS - 1), false)
        assert.equal(shouldAutoDropTrack(track, 1000 + AUTO_DROP_REMOVE_DELAY_MS), true)
    })

    it('does not remove tracks that became ineligible after entering DROP phase', () => {
        const expiredDropAt = 1000
        const removalTimestamp = expiredDropAt + AUTO_DROP_REMOVE_DELAY_MS

        assert.equal(
            shouldAutoDropTrack(createTrack({dropAt: expiredDropAt, dropProtect: true}), removalTimestamp),
            false,
        )
        assert.equal(
            shouldAutoDropTrack(createTrack({dropAt: expiredDropAt, correlated: true}), removalTimestamp),
            false,
        )
    })

    it('removes manual tracks at removal time when drop protect is not enabled', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createTrack({
            dropRiskAt: 1000,
            dropAt: 1000,
            source: 'manual',
        }))

        const removedTrackIds = processAutoDropTracks(
            trackStore,
            1000 + AUTO_DROP_REMOVE_DELAY_MS,
        )

        assert.deepEqual(removedTrackIds, ['TRK-test'])
        assert.equal(trackStore.getTrack('TRK-test'), null)
    })

    it('clears auto-drop state instead of removing drop-protected tracks at removal time', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createTrack({
            dropRiskAt: 1000,
            dropAt: 1000,
            source: 'manual',
            dropProtect: true,
        }))

        const removedTrackIds = processAutoDropTracks(
            trackStore,
            1000 + AUTO_DROP_REMOVE_DELAY_MS,
        )

        assert.deepEqual(removedTrackIds, [])
        assert.equal(trackStore.getTrack('TRK-test').dropAt, undefined)
        assert.equal(trackStore.getTrack('TRK-test').dropRiskAt, undefined)
    })

    it('clears auto-drop state when a track becomes correlated', () => {
        const updates = getAutoDropProgressUpdates(
            createTrack({dropRiskAt: 1000, dropAt: 6000, correlated: true}),
            7000,
        )

        assert.deepEqual(updates, {dropRiskAt: undefined, dropAt: undefined})
    })

    it('processes countdown, visible DROP, and removal through TrackStore', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createTrack())

        processAutoDropTracks(trackStore, 1000)
        assert.equal(trackStore.getTrack('TRK-test').dropRiskAt, 1000)
        assert.equal(trackStore.getTrack('TRK-test').dropAt, undefined)

        processAutoDropTracks(trackStore, 1000 + AUTO_DROP_RISK_DELAY_MS)
        assert.equal(trackStore.getTrack('TRK-test').dropAt, 6000)

        const removedTrackIds = processAutoDropTracks(
            trackStore,
            6000 + AUTO_DROP_REMOVE_DELAY_MS,
        )

        assert.deepEqual(removedTrackIds, ['TRK-test'])
        assert.equal(trackStore.getTrack('TRK-test'), null)
    })

    it('derives DROP attention during visible auto-drop phase', () => {
        const flags = deriveAttentionFlagsFromTrackState(createTrack({dropAt: 5000}))

        assert.ok(flags.includes('DROP'))
    })

    it('does not derive STALE attention when DROP attention is active', () => {
        const flags = deriveAttentionFlagsFromTrackState(createTrack({
            dropAt: 5000,
            stale: true,
        }))

        assert.ok(flags.includes('DROP'))
        assert.ok(!flags.includes('STALE'))
    })

    it('does not derive DROP attention for ineligible tracks with stale dropAt', () => {
        const flags = deriveAttentionFlagsFromTrackState(createTrack({
            dropAt: 5000,
            dropProtect: true,
        }))

        assert.ok(!flags.includes('DROP'))
    })

    it('shows DROP attention only when auto-drop is still eligible', () => {
        assert.equal(shouldShowDropAttention(createTrack({dropAt: 5000})), true)
        assert.equal(shouldShowDropAttention(createTrack({dropAt: 5000, source: 'manual'})), true)
        assert.equal(shouldShowDropAttention(createTrack({dropAt: 5000, dropProtect: true})), false)
    })

    it('clears stale auto-drop timestamps when a track is upserted as manual', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createTrack({
            dropRiskAt: 1000,
            dropAt: 6000,
        }))

        trackStore.upsertManualTrack(createTrack({
            source: 'manual',
            userDirected: true,
        }))

        const manualTrack = trackStore.getTrack('TRK-test')

        assert.equal(manualTrack.source, 'manual')
        assert.equal(manualTrack.dropAt, undefined)
        assert.equal(manualTrack.dropRiskAt, undefined)
    })
})
