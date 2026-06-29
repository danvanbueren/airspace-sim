import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {CorrelationService} from '../../app/simulation/CorrelationService.js'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {mergeTracksFromCorrelatedDetections} from '../../app/simulation/trackMerge.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'
import {TRACK_IDENTITIES} from '../../app/tools/milstd2525/trackSymbolCodes.js'

function activeTrack(overrides = {}) {
    return {
        id: overrides.id,
        trackId: overrides.id,
        source: 'auto',
        identity: TRACK_IDENTITIES.NEUTRAL,
        latitude: overrides.latitude,
        longitude: overrides.longitude ?? -75,
        heading: overrides.heading ?? 90,
        speed: overrides.speed ?? 400,
        altitude: overrides.altitude ?? 30000,
        lastSensorUpdateAt: overrides.lastSensorUpdateAt ?? 1_000,
        lastExtrapolationAt: overrides.lastExtrapolationAt ?? 1_000,
        stale: false,
        domain: 'air',
        type: '01:110104',
        callsign: overrides.id,
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        correlated: overrides.correlated ?? false,
        userDirected: overrides.userDirected ?? false,
        lastUserKinematicEditAt: overrides.lastUserKinematicEditAt,
        lastUserKinematicEditFields: overrides.lastUserKinematicEditFields,
    }
}

describe('CorrelationService', () => {
    it('assigns each active track at most one detection per scan before merge', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-1',
            latitude: 40,
            lastSensorUpdateAt: 1_500,
        }))
        trackStore.addTrack(activeTrack({
            id: 'TRK-2',
            latitude: 40.01,
            lastSensorUpdateAt: 1_000,
        }))

        const correlation = new CorrelationService()
        const correlatedDetections = correlation.apply([
            {
                plotId: 'PLOT-1',
                latitude: 40,
                longitude: -75,
            },
            {
                plotId: 'PLOT-2',
                latitude: 40.004,
                longitude: -75,
            },
        ], trackStore, 5, 2_000)

        assert.deepEqual(
            correlatedDetections.map((detection) => detection.correlatedTrackId).sort(),
            ['TRK-1', 'TRK-2'],
        )

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(
            trackStore,
            correlatedDetections,
            3,
            2_000,
        )

        assert.deepEqual(mergedAwayIds, [])
        assert.equal(trackStore.getAllTracks().length, 2)
        assert.ok(trackStore.getTrack('TRK-1'))
        assert.ok(trackStore.getTrack('TRK-2'))
    })

    it('does not snap correlated track position while a user kinematic hold is active', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-1',
            latitude: 40,
            longitude: -75,
            lastUserKinematicEditAt: 2_000,
            lastUserKinematicEditFields: ['heading'],
        }))

        const correlation = new CorrelationService()
        correlation.apply([
            {
                plotId: 'PLOT-1',
                latitude: 40.002,
                longitude: -75,
            },
        ], trackStore, 5, 2_500)

        const track = trackStore.getTrack('TRK-1')

        assert.equal(track.latitude, 40)
        assert.equal(track.longitude, -75)
        assert.equal(track.correlated, true)
    })

    it('updates kinematics when correlated position snaps to a sensor return', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-1',
            latitude: 40,
            longitude: -75,
            heading: 90,
            speed: 400,
            altitude: 30_000,
        }))

        const correlation = new CorrelationService({
            flightWorld: {
                findNearestAircraft() {
                    return {
                        heading: 215.4,
                        speed: 478.6,
                        altitude: 28_400.2,
                    }
                },
            },
        })

        correlation.apply([
            {
                plotId: 'PLOT-1',
                latitude: 40.02,
                longitude: -74.98,
            },
        ], trackStore, 5, 2_000)

        const track = trackStore.getTrack('TRK-1')

        assert.equal(track.latitude, 40.02)
        assert.equal(track.longitude, -74.98)
        assert.equal(track.heading, 215)
        assert.equal(track.speed, 479)
        assert.equal(track.altitude, 28_400)
        assert.equal(track.correlated, true)
    })
})
