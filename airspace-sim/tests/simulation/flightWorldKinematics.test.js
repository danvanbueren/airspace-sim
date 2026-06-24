import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    altitudeAlongRouteProfile,
    getRouteProgressRatio,
    speedForAltitude,
    updateAircraftKinematics,
} from '../../app/simulation/flightWorldKinematics.js'

function aircraft(overrides = {}) {
    return {
        totalRouteNm: 1000,
        progressNm: 0,
        cruiseAltitude: 35_000,
        fieldAltitude: 1500,
        baseSpeed: 430,
        speedBias: 0,
        speedJitter: 0,
        ...overrides,
    }
}

describe('flight world kinematics', () => {
    it('climbs after departure and descends before arrival', () => {
        const climb = altitudeAlongRouteProfile(aircraft({progressNm: 60}))
        const cruise = altitudeAlongRouteProfile(aircraft({progressNm: 500}))
        const descent = altitudeAlongRouteProfile(aircraft({progressNm: 950}))

        assert.ok(climb > 1500)
        assert.ok(climb < 35_000)
        assert.ok(Math.abs(cruise - 35_000) <= 400)
        assert.ok(descent < cruise)
        assert.ok(descent > 1500)
    })

    it('increases speed with altitude and applies jitter', () => {
        const lowAltitudeSpeed = speedForAltitude(430, 20_000, 0, 0)
        const highAltitudeSpeed = speedForAltitude(430, 38_000, 0, 0)
        const jitteredSpeed = speedForAltitude(430, 38_000, 0, 5)

        assert.ok(highAltitudeSpeed > lowAltitudeSpeed)
        assert.equal(jitteredSpeed, highAltitudeSpeed + 5)
    })

    it('updates altitude and speed as an aircraft progresses', () => {
        const departing = updateAircraftKinematics(
            aircraft({progressNm: 20}),
            1,
            () => 0.1,
        )
        const cruising = updateAircraftKinematics(
            aircraft({progressNm: 500}),
            1,
            () => 0.9,
        )

        assert.ok(departing.altitude < cruising.altitude)
        assert.ok(departing.speed > 0)
        assert.ok(cruising.speed > 0)
        assert.notEqual(getRouteProgressRatio(aircraft({progressNm: 20})), 0)
    })
})
