import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    findTruthAircraftForTrack,
    isTruthAircraftNearTrack,
} from '../../app/simulation/trackTruthProximity.js'

function createFlightWorld(aircraft = []) {
    const byId = new Map(aircraft.map((entry) => [entry.id, entry]))

    return {
        getAircraftById(id) {
            return byId.get(id) ?? null
        },
        getAllAircraft() {
            return aircraft
        },
        findNearestAircraft(longitude, latitude, maxDistanceNm = 15) {
            let best = null
            let bestDistance = Infinity

            for (const candidate of aircraft) {
                const distance = Math.abs(candidate.longitude - longitude)
                    + Math.abs(candidate.latitude - latitude)

                if (distance < bestDistance && distance <= maxDistanceNm) {
                    bestDistance = distance
                    best = candidate
                }
            }

            return best
        },
        findAircraftByMode3Code(mode3Code, maxDistanceNm, longitude, latitude) {
            return aircraft.find((candidate) => (
                candidate.mode3Code === mode3Code
                && Math.abs(candidate.longitude - longitude) + Math.abs(candidate.latitude - latitude) <= maxDistanceNm
            )) ?? null
        },
    }
}

describe('trackTruthProximity', () => {
    it('prefers the linked truth aircraft id over nearest-neighbor fallback', () => {
        const flightWorld = createFlightWorld([
            {id: 'FLT-1', longitude: -80, latitude: 40, mode3Code: '1200'},
            {id: 'FLT-2', longitude: -79.99, latitude: 40.01, mode3Code: '4500'},
        ])
        const track = {
            truthAircraftId: 'FLT-1',
            longitude: -80,
            latitude: 40,
            iffMode3Code: '4500',
        }

        assert.equal(findTruthAircraftForTrack(flightWorld, track, 5)?.id, 'FLT-1')
    })

    it('reports truth proximity when the linked aircraft remains within correlation range', () => {
        const flightWorld = createFlightWorld([
            {id: 'FLT-1', longitude: -80, latitude: 40},
        ])

        assert.equal(isTruthAircraftNearTrack(flightWorld, {
            truthAircraftId: 'FLT-1',
            longitude: -80,
            latitude: 40,
        }, {correlationThresholdNm: 5}), true)
    })
})
