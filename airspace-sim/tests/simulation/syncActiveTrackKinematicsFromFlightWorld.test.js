import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {syncActiveTrackKinematicsFromFlightWorld} from '../../app/simulation/syncActiveTrackKinematicsFromFlightWorld.js'
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

    it('preserves operator-committed kinematic fields', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            heading: 90,
            lastManagementEditFields: ['heading'],
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
        )

        const updatedTrack = trackStore.getTrack('TRK-1')

        assert.equal(updatedTrack.heading, 90)
        assert.equal(updatedTrack.speed, 500)
        assert.equal(updatedTrack.altitude, 35_000)
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
})
