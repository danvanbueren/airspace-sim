import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {mergeProximityClusters} from '../../app/simulation/trackMerge.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'
import {TRACK_IDENTITIES} from '../../app/tools/milstd2525/trackSymbolCodes.js'

function activeTrack(overrides) {
    return {
        id: overrides.id,
        trackId: overrides.id,
        source: overrides.source ?? 'auto',
        callsign: overrides.callsign ?? overrides.id,
        identity: overrides.identity ?? TRACK_IDENTITIES.NEUTRAL,
        latitude: overrides.latitude ?? 40,
        longitude: overrides.longitude ?? -75,
        lastSensorUpdateAt: overrides.lastSensorUpdateAt ?? 1_000,
        lastUserEditAt: overrides.lastUserEditAt,
        userDirected: overrides.userDirected ?? false,
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
    }
}

function createFakeTrackStore(tracks, manualTrackIds = []) {
    const mergeCalls = []

    return {
        mergeCalls,
        getAllTracks: () => tracks,
        isManual: (trackId) => manualTrackIds.includes(trackId),
        mergeTracks: (survivorId, mergedId, timestamp) => {
            mergeCalls.push({survivorId, mergedId, timestamp})
        },
    }
}

describe('mergeProximityClusters', () => {
    it('does not merge nearby active tracks with different identities', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'TRK-friendly',
                identity: TRACK_IDENTITIES.FRIENDLY,
            }),
            activeTrack({
                id: 'TRK-hostile',
                identity: TRACK_IDENTITIES.HOSTILE,
                latitude: 40.02,
            }),
        ])

        const mergedAwayIds = mergeProximityClusters(trackStore, 3, 2_000)

        assert.deepEqual(mergedAwayIds, [])
        assert.deepEqual(trackStore.mergeCalls, [])
    })

    it('merges nearby active tracks with the same identity even when callsigns differ', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'TRK-radar-A',
                callsign: 'FLT-A',
                identity: TRACK_IDENTITIES.NEUTRAL,
            }),
            activeTrack({
                id: 'TRK-radar-B',
                callsign: 'FLT-B',
                identity: TRACK_IDENTITIES.NEUTRAL,
                latitude: 40.02,
                lastSensorUpdateAt: 1_500,
            }),
        ])

        const mergedAwayIds = mergeProximityClusters(trackStore, 3, 2_000)

        assert.deepEqual(mergedAwayIds, ['TRK-radar-A'])
        assert.deepEqual(trackStore.mergeCalls, [{
            survivorId: 'TRK-radar-B',
            mergedId: 'TRK-radar-A',
            timestamp: 2_000,
        }])
    })

    it('merges duplicate active tracks for the same contact', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'TRK-radar-A',
                callsign: 'FLT-A',
                identity: TRACK_IDENTITIES.NEUTRAL,
            }),
            activeTrack({
                id: 'TRK-iff-A',
                callsign: 'FLT-A',
                identity: TRACK_IDENTITIES.NEUTRAL,
                latitude: 40.02,
                lastSensorUpdateAt: 1_500,
            }),
        ])

        const mergedAwayIds = mergeProximityClusters(trackStore, 3, 2_000)

        assert.deepEqual(mergedAwayIds, ['TRK-radar-A'])
        assert.deepEqual(trackStore.mergeCalls, [{
            survivorId: 'TRK-iff-A',
            mergedId: 'TRK-radar-A',
            timestamp: 2_000,
        }])
    })

    it('merges manual and auto tracks when identity matches', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'MANUAL-1',
                source: 'manual',
                callsign: 'EAGLE01',
                identity: TRACK_IDENTITIES.FRIENDLY,
                userDirected: true,
                lastUserEditAt: 2_500,
            }),
            activeTrack({
                id: 'TRK-radar-A',
                callsign: 'FLT-A',
                identity: TRACK_IDENTITIES.FRIENDLY,
                latitude: 40.02,
                lastSensorUpdateAt: 1_500,
            }),
        ], ['MANUAL-1'])

        const mergedAwayIds = mergeProximityClusters(trackStore, 3, 2_000)

        assert.deepEqual(mergedAwayIds, ['TRK-radar-A'])
        assert.deepEqual(trackStore.mergeCalls, [{
            survivorId: 'MANUAL-1',
            mergedId: 'TRK-radar-A',
            timestamp: 2_000,
        }])
    })

    it('does not merge manual and auto tracks when identities differ', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'MANUAL-1',
                source: 'manual',
                callsign: 'EAGLE01',
                identity: TRACK_IDENTITIES.FRIENDLY,
            }),
            activeTrack({
                id: 'TRK-radar-A',
                callsign: 'FLT-A',
                identity: TRACK_IDENTITIES.HOSTILE,
                latitude: 40.02,
            }),
        ], ['MANUAL-1'])

        const mergedAwayIds = mergeProximityClusters(trackStore, 3, 2_000)

        assert.deepEqual(mergedAwayIds, [])
        assert.deepEqual(trackStore.mergeCalls, [])
    })
})
