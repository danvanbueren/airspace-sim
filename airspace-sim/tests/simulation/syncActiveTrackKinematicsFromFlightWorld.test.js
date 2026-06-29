import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    buildCorrelatedTrackKinematicUpdates,
    findCorrelatedAircraftForTrack,
    syncActiveTrackKinematicsFromFlightWorld,
} from '../../app/simulation/syncActiveTrackKinematicsFromFlightWorld.js'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'

function createFlightWorld(aircraft = []) {
    return {
        findNearestAircraft(longitude, latitude) {
            let best = null
            let bestDistance = Infinity

            for (const candidate of aircraft) {
                const distance = Math.abs(candidate.longitude - longitude)
                    + Math.abs(candidate.latitude - latitude)

                if (distance < bestDistance) {
                    bestDistance = distance
                    best = candidate
                }
            }

            return best
        },
        findAircraftByMode3Code(mode3Code, maxDistanceNm, longitude, latitude) {
            let best = null
            let bestDistance = Infinity

            for (const candidate of aircraft) {
                if (candidate.mode3Code !== mode3Code) {
                    continue
                }

                const distance = Math.abs(candidate.longitude - longitude)
                    + Math.abs(candidate.latitude - latitude)

                if (distance < bestDistance && distance <= maxDistanceNm) {
                    bestDistance = distance
                    best = candidate
                }
            }

            return best
        },
    }
}

function activeTrack(overrides = {}) {
    return {
        id: 'TRK-1',
        trackId: 'TRK-1',
        longitude: -75,
        latitude: 40,
        heading: 90,
        speed: 400,
        altitude: 30_000,
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        correlated: true,
        source: 'auto',
        ...overrides,
    }
}

describe('syncActiveTrackKinematicsFromFlightWorld', () => {
    it('updates active correlated track kinematics from the nearest aircraft', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack())

        syncActiveTrackKinematicsFromFlightWorld(
            createFlightWorld([{
                longitude: -75,
                latitude: 40,
                heading: 127.4,
                speed: 455.6,
                altitude: 31_250.2,
            }]),
            trackStore,
        )

        const updatedTrack = trackStore.getTrack('TRK-1')

        assert.equal(updatedTrack.heading, 127)
        assert.equal(updatedTrack.speed, 456)
        assert.equal(updatedTrack.altitude, 31_250)
    })

    it('syncs all kinematics when hold expired despite stale management edit fields', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            heading: 90,
            speed: 400,
            altitude: 30_000,
            lastManagementEditFields: ['heading'],
        }))

        syncActiveTrackKinematicsFromFlightWorld(
            createFlightWorld([{
                longitude: -75,
                latitude: 40,
                heading: 200,
                speed: 500,
                altitude: 35_000,
            }]),
            trackStore,
        )

        const updatedTrack = trackStore.getTrack('TRK-1')

        assert.equal(updatedTrack.heading, 200)
        assert.equal(updatedTrack.speed, 500)
        assert.equal(updatedTrack.altitude, 35_000)
    })

    it('skips truth-aircraft sync while an operator kinematic hold is active', () => {
        const now = 10_000
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            heading: 90,
            speed: 400,
            altitude: 30_000,
            lastManagementEditFields: ['heading'],
            lastUserKinematicEditAt: now,
            lastUserKinematicEditFields: ['heading'],
            userDirected: true,
        }))

        syncActiveTrackKinematicsFromFlightWorld(
            createFlightWorld([{
                longitude: -75,
                latitude: 40,
                heading: 200,
                speed: 500,
                altitude: 35_000,
            }]),
            trackStore,
            now + 5_000,
        )

        const updatedTrack = trackStore.getTrack('TRK-1')

        assert.equal(updatedTrack.heading, 90)
        assert.equal(updatedTrack.speed, 400)
        assert.equal(updatedTrack.altitude, 30_000)
    })

    it('uses tick timestamp for correlation hold expiry', () => {
        const editAt = 10_000
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            heading: 90,
            lastUserKinematicEditAt: editAt,
            lastUserKinematicEditFields: ['heading'],
        }))

        const flightWorld = createFlightWorld([{
            longitude: -75,
            latitude: 40,
            heading: 200,
            speed: 500,
            altitude: 35_000,
        }])

        syncActiveTrackKinematicsFromFlightWorld(flightWorld, trackStore, editAt + 5_000)

        assert.equal(trackStore.getTrack('TRK-1').heading, 90)

        syncActiveTrackKinematicsFromFlightWorld(flightWorld, trackStore, editAt + 10_001)

        assert.equal(trackStore.getTrack('TRK-1').heading, 200)
    })

    it('does not update suspended tracks', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            correlationMode: TRACK_CORRELATION_MODES.SUSPEND,
            speed: 0,
        }))

        syncActiveTrackKinematicsFromFlightWorld(
            createFlightWorld([{
                longitude: -75,
                latitude: 40,
                heading: 200,
                speed: 500,
                altitude: 35_000,
            }]),
            trackStore,
        )

        const updatedTrack = trackStore.getTrack('TRK-1')

        assert.equal(updatedTrack.heading, 90)
        assert.equal(updatedTrack.speed, 0)
        assert.equal(updatedTrack.altitude, 30_000)
    })

    it('prefers IFF mode 3 aircraft over a closer unrelated neighbor', () => {
        const flightWorld = createFlightWorld([
            {
                longitude: -75,
                latitude: 40,
                heading: 10,
                speed: 300,
                altitude: 20_000,
            },
            {
                longitude: -75.01,
                latitude: 40.01,
                mode3Code: '4521',
                heading: 210,
                speed: 510,
                altitude: 33_000,
            },
        ])
        const track = activeTrack({
            iffMode3Code: '4521',
            longitude: -75.2,
            latitude: 40.2,
        })

        const aircraft = findCorrelatedAircraftForTrack(flightWorld, track, {
            longitude: -75.2,
            latitude: 40.2,
            mode3Code: '4521',
        })

        assert.equal(aircraft.mode3Code, '4521')
        assert.equal(aircraft.heading, 210)
    })

    it('derives heading and speed from a position update when truth aircraft is unavailable', () => {
        const track = activeTrack({
            longitude: -75,
            latitude: 40,
            heading: 90,
            speed: 400,
            lastSensorUpdateAt: 0,
            lastExtrapolationAt: 0,
        })

        const updates = buildCorrelatedTrackKinematicUpdates(
            createFlightWorld([]),
            track,
            {
                longitude: -74.5,
                latitude: 40,
            },
            234_000,
        )

        assert.ok(updates)
        assert.equal(updates.heading, 90)
        assert.equal(updates.speed, 354)
    })
})
