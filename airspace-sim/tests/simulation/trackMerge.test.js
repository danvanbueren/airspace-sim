import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    buildMergedTrackState,
    mergeTracksFromCorrelatedDetections,
} from '../../app/simulation/trackMerge.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'
import {TRACK_IDENTITIES} from '../../app/tools/milstd2525/trackSymbolCodes.js'

function activeTrack(overrides) {
    return {
        id: overrides.id,
        trackId: overrides.id,
        source: overrides.source ?? 'auto',
        callsign: overrides.callsign ?? overrides.id,
        type: overrides.type ?? '01:110104',
        identity: overrides.identity ?? TRACK_IDENTITIES.NEUTRAL,
        latitude: overrides.latitude ?? 40,
        longitude: overrides.longitude ?? -75,
        heading: overrides.heading ?? 90,
        speed: overrides.speed ?? 400,
        altitude: overrides.altitude ?? 30000,
        lastSensorUpdateAt: overrides.lastSensorUpdateAt ?? 1_000,
        lastUserEditAt: overrides.lastUserEditAt,
        userDirected: overrides.userDirected ?? false,
        correlated: overrides.correlated ?? false,
        correlationMode: overrides.correlationMode ?? TRACK_CORRELATION_MODES.ACTIVE,
    }
}

function createFakeTrackStore(tracks, manualTrackIds = []) {
    const mergeCalls = []

    return {
        mergeCalls,
        getAllTracks: () => tracks,
        getTrack: (trackId) => tracks.find((track) => track.id === trackId) ?? null,
        isManual: (trackId) => manualTrackIds.includes(trackId),
        mergeTracks: (survivorId, mergedId, timestamp) => {
            mergeCalls.push({survivorId, mergedId, timestamp})
        },
    }
}

describe('mergeTracksFromCorrelatedDetections', () => {
    it('does not merge formation tracks that each correlated to their own sensor return', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'TRK-1',
                callsign: 'CIV01',
                latitude: 40,
                correlated: true,
            }),
            activeTrack({
                id: 'TRK-2',
                callsign: 'CIV02',
                latitude: 40.02,
                correlated: true,
                lastSensorUpdateAt: 1_500,
            }),
        ])

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(trackStore, [
            {
                correlated: true,
                correlatedTrackId: 'TRK-1',
                latitude: 40,
                longitude: -75,
            },
            {
                correlated: true,
                correlatedTrackId: 'TRK-2',
                latitude: 40.02,
                longitude: -75,
            },
        ], 3, 2_000)

        assert.deepEqual(mergedAwayIds, [])
        assert.deepEqual(trackStore.mergeCalls, [])
    })

    it('merges a duplicate track that lost correlation to a nearby winner', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'TRK-radar-A',
                callsign: 'CIV03',
                latitude: 40,
                correlated: true,
                lastSensorUpdateAt: 2_000,
            }),
            activeTrack({
                id: 'TRK-iff-A',
                callsign: 'CIV04',
                latitude: 40.01,
                correlated: false,
                lastSensorUpdateAt: 1_000,
            }),
        ])

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-radar-A',
            latitude: 40,
            longitude: -75,
        }], 3, 2_000)

        assert.deepEqual(mergedAwayIds, ['TRK-iff-A'])
        assert.deepEqual(trackStore.mergeCalls, [{
            survivorId: 'TRK-radar-A',
            mergedId: 'TRK-iff-A',
            timestamp: 2_000,
        }])
    })

    it('does not merge extrapolated or suspended tracks', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'TRK-winner',
                correlated: true,
                lastSensorUpdateAt: 2_000,
            }),
            activeTrack({
                id: 'TRK-extrapolated',
                latitude: 40.01,
                correlationMode: TRACK_CORRELATION_MODES.EXTRAPOLATED,
            }),
            activeTrack({
                id: 'TRK-suspended',
                latitude: 40.02,
                correlationMode: TRACK_CORRELATION_MODES.SUSPEND,
            }),
        ])

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-winner',
            latitude: 40,
            longitude: -75,
        }], 3, 2_000)

        assert.deepEqual(mergedAwayIds, [])
    })

    it('does not merge tracks with different identities', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'TRK-friendly',
                identity: TRACK_IDENTITIES.FRIENDLY,
                correlated: true,
                lastSensorUpdateAt: 2_000,
            }),
            activeTrack({
                id: 'TRK-hostile',
                identity: TRACK_IDENTITIES.HOSTILE,
                latitude: 40.01,
            }),
        ])

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-friendly',
            latitude: 40,
            longitude: -75,
        }], 3, 2_000)

        assert.deepEqual(mergedAwayIds, [])
    })

    it('merges auto tracks when one is pending and the other is neutral', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'TRK-winner',
                identity: TRACK_IDENTITIES.PENDING,
                correlated: true,
                lastSensorUpdateAt: 2_000,
            }),
            activeTrack({
                id: 'TRK-stale',
                identity: TRACK_IDENTITIES.NEUTRAL,
                latitude: 40.01,
                correlated: false,
            }),
        ])

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-winner',
            latitude: 40,
            longitude: -75,
        }], 3, 2_000)

        assert.deepEqual(mergedAwayIds, ['TRK-stale'])
    })

    it('merges manual and auto tracks when the auto track won correlation', () => {
        const trackStore = createFakeTrackStore([
            activeTrack({
                id: 'MANUAL-1',
                source: 'manual',
                callsign: 'EAGLE01',
                identity: TRACK_IDENTITIES.FRIENDLY,
                userDirected: true,
                lastUserEditAt: 2_500,
                latitude: 40.01,
            }),
            activeTrack({
                id: 'TRK-radar-A',
                callsign: 'CIV03',
                identity: TRACK_IDENTITIES.FRIENDLY,
                latitude: 40,
                correlated: true,
                lastSensorUpdateAt: 2_000,
            }),
        ], ['MANUAL-1'])

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-radar-A',
            latitude: 40,
            longitude: -75,
        }], 3, 2_000)

        assert.deepEqual(mergedAwayIds, ['TRK-radar-A'])
        assert.deepEqual(trackStore.mergeCalls, [{
            survivorId: 'MANUAL-1',
            mergedId: 'TRK-radar-A',
            timestamp: 2_000,
        }])
    })
})

describe('buildMergedTrackState', () => {
    it('keeps the most recent callsign and type while preserving correlated kinematics', () => {
        const mergedState = buildMergedTrackState(
            activeTrack({
                id: 'TRK-survivor',
                callsign: 'OLD',
                type: '01:111101',
                heading: 10,
                speed: 300,
                altitude: 20000,
                correlated: true,
                lastSensorUpdateAt: 2_000,
            }),
            activeTrack({
                id: 'TRK-merged',
                callsign: 'NEW',
                type: '01:110104',
                heading: 250,
                speed: 500,
                altitude: 35000,
                correlated: false,
                lastSensorUpdateAt: 1_000,
                lastUserEditAt: 3_000,
            }),
            4_000,
        )

        assert.equal(mergedState.callsign, 'NEW')
        assert.equal(mergedState.type, '01:110104')
        assert.equal(mergedState.heading, 10)
        assert.equal(mergedState.speed, 300)
        assert.equal(mergedState.altitude, 20000)
    })
})
