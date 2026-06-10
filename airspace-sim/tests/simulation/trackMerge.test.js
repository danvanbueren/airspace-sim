import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {mergeProximityClusters} from '../../app/simulation/trackMerge.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'

function activeAutoTrack(overrides) {
    return {
        id: overrides.id,
        trackId: overrides.id,
        source: 'auto',
        callsign: overrides.callsign,
        latitude: overrides.latitude ?? 40,
        longitude: overrides.longitude ?? -75,
        lastSensorUpdateAt: overrides.lastSensorUpdateAt ?? 1_000,
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
    }
}

function createFakeTrackStore(tracks) {
    const mergeCalls = []

    return {
        mergeCalls,
        getAllTracks: () => tracks,
        isManual: () => false,
        mergeTracks: (survivorId, mergedId, timestamp) => {
            mergeCalls.push({survivorId, mergedId, timestamp})
        },
    }
}

describe('mergeProximityClusters', () => {
    it('does not merge nearby active tracks for different aircraft', () => {
        const trackStore = createFakeTrackStore([
            activeAutoTrack({id: 'TRK-radar-A', callsign: 'FLT-A'}),
            activeAutoTrack({
                id: 'TRK-radar-B',
                callsign: 'FLT-B',
                latitude: 40.02,
            }),
        ])

        const mergedAwayIds = mergeProximityClusters(trackStore, 3, 2_000)

        assert.deepEqual(mergedAwayIds, [])
        assert.deepEqual(trackStore.mergeCalls, [])
    })

    it('still merges duplicate active tracks for the same aircraft', () => {
        const trackStore = createFakeTrackStore([
            activeAutoTrack({id: 'TRK-radar-A', callsign: 'FLT-A'}),
            activeAutoTrack({
                id: 'TRK-iff-A',
                callsign: 'FLT-A',
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

    it('does not merge tracks that only share an auto-generated track callsign', () => {
        const trackStore = createFakeTrackStore([
            activeAutoTrack({id: 'TRK-radar-A', callsign: 'TRK-radar-PLOT'}),
            activeAutoTrack({
                id: 'TRK-radar-B',
                callsign: 'TRK-radar-PLOT',
                latitude: 40.02,
            }),
        ])

        const mergedAwayIds = mergeProximityClusters(trackStore, 3, 2_000)

        assert.deepEqual(mergedAwayIds, [])
        assert.deepEqual(trackStore.mergeCalls, [])
    })
})
