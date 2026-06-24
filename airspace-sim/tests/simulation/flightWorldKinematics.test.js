import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    altitudeAlongRouteProfile,
    getKinematicOscillation,
    getRouteProgressRatio,
    speedAlongRouteProfile,
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
        kinematicPhase: 0,
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

    it('keeps climb speeds low and increases cruise speed with altitude', () => {
        const climbSpeed = speedAlongRouteProfile(aircraft({
            progressNm: 20,
        }))
        const lowCruiseSpeed = speedAlongRouteProfile(aircraft({
            progressNm: 500,
            cruiseAltitude: 25_000,
        }))
        const highCruiseSpeed = speedAlongRouteProfile(aircraft({
            progressNm: 500,
            cruiseAltitude: 39_000,
        }))

        assert.ok(climbSpeed <= 310)
        assert.ok(highCruiseSpeed > lowCruiseSpeed)
        assert.ok(highCruiseSpeed > climbSpeed)
    })

    it('oscillates speed and heading over time', () => {
        const first = updateAircraftKinematics(aircraft({progressNm: 500}), 90, 1)
        const second = updateAircraftKinematics({
            ...aircraft({progressNm: 500}),
            kinematicPhase: first.kinematicPhase,
        }, 90, 1)

        assert.notEqual(first.speed, second.speed)
        assert.notEqual(first.heading, second.heading)
        assert.ok(getKinematicOscillation(aircraft(), 1).kinematicPhase > 0)
    })

    it('updates altitude and speed as an aircraft progresses', () => {
        const departing = updateAircraftKinematics(
            aircraft({progressNm: 20}),
            90,
            1,
        )
        const cruising = updateAircraftKinematics(
            aircraft({progressNm: 500}),
            90,
            1,
        )

        assert.ok(departing.altitude < cruising.altitude)
        assert.ok(departing.speed < cruising.speed)
        assert.notEqual(getRouteProgressRatio(aircraft({progressNm: 20})), 0)
    })
})
