import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {USER_CORRELATION_HOLD_MS} from '../../app/simulation/correlationHold.js'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'

const settings = {
    radarRefreshMs: 4000,
    iffRefreshMs: 1000,
}

function movingTrack(overrides = {}) {
    return {
        id: 'TRK-1',
        trackId: 'TRK-1',
        longitude: -75,
        latitude: 40,
        heading: 90,
        speed: 400,
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        correlated: true,
        source: 'auto',
        lastSensorUpdateAt: 10_000,
        ...overrides,
    }
}

describe('TrackStore extrapolation', () => {
    it('continues extrapolating during a correlation hold using committed kinematics', () => {
        const editAt = 10_000
        const trackStore = new TrackStore()
        trackStore.addTrack(movingTrack({
            heading: 180,
            lastUserKinematicEditAt: editAt,
            lastUserKinematicEditFields: ['heading'],
        }))

        trackStore.extrapolate(editAt + 5_000, 1, settings)

        const track = trackStore.getTrack('TRK-1')

        assert.equal(track.longitude, -75)
        assert.notEqual(track.latitude, 40)
    })

    it('continues extrapolating while decorrelated and under a kinematic hold', () => {
        const editAt = 10_000
        const trackStore = new TrackStore()
        trackStore.addTrack(movingTrack({
            heading: 180,
            correlated: false,
            stale: true,
            lastUserKinematicEditAt: editAt,
            lastUserKinematicEditFields: ['heading'],
        }))

        trackStore.extrapolate(editAt + 5_000, 1, settings)

        const track = trackStore.getTrack('TRK-1')

        assert.equal(track.longitude, -75)
        assert.notEqual(track.latitude, 40)
        assert.equal(track.correlated, false)
    })

    it('keeps extrapolating after the correlation hold expires', () => {
        const editAt = 10_000
        const trackStore = new TrackStore()
        trackStore.addTrack(movingTrack({
            lastUserKinematicEditAt: editAt,
            lastUserKinematicEditFields: ['heading'],
        }))

        trackStore.extrapolate(editAt + USER_CORRELATION_HOLD_MS + 1, 1, settings)

        const track = trackStore.getTrack('TRK-1')

        assert.notEqual(track.longitude, -75)
        assert.notEqual(track.latitude, 40)
    })
})
