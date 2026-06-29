import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {describe, it} from 'node:test'

async function readJson(relativePath) {
    const url = new URL(relativePath, import.meta.url)
    const contents = await readFile(url, 'utf8')

    return JSON.parse(contents)
}

const VALID_AIRPORT_CLASSES = new Set(['major', 'strip', 'military'])
const VALID_TRAFFIC_KINDS = new Set(['commercial', 'military'])
const VALID_PROFILES = new Set(['civilian', 'commercial', 'fighter', 'tanker', 'transport'])

describe('flight world data', () => {
    it('contains valid routes with known airports', async () => {
        const airports = await readJson('../../app/data/airports.json')
        const routes = await readJson('../../app/data/airRoutes.json')
        const airportIds = new Set(airports.map((airport) => airport.icao))

        assert.ok(airports.length >= 25_000, 'expected comprehensive worldwide airport coverage')
        assert.ok(routes.length >= 10_000, 'expected a substantial trunk route catalog')

        airports.forEach((airport) => {
            assert.ok(airport.icao, 'airport must have an ICAO-like identifier')
            assert.ok(Number.isFinite(airport.lng), `${airport.icao} must have longitude`)
            assert.ok(Number.isFinite(airport.lat), `${airport.icao} must have latitude`)
            assert.ok(VALID_AIRPORT_CLASSES.has(airport.class), `${airport.icao} has invalid class`)
            assert.match(airport.nationality ?? '', /^[A-Z]{2}$/, `${airport.icao} must have ISO nationality`)
        })

        assert.ok(airportIds.has('KJFK'), 'expected New York JFK in catalog')
        assert.ok(airportIds.has('EGLL'), 'expected London Heathrow in catalog')

        routes.forEach((route) => {
            assert.ok(airportIds.has(route.origin), `${route.id} has unknown origin`)
            assert.ok(airportIds.has(route.destination), `${route.id} has unknown destination`)
            assert.ok(VALID_TRAFFIC_KINDS.has(route.trafficKind), `${route.id} has invalid trafficKind`)
            assert.ok(VALID_PROFILES.has(route.profile), `${route.id} has invalid profile`)

            const waypoints = route.waypoints ?? []

            waypoints.forEach((waypoint) => {
                assert.ok(airportIds.has(waypoint), `${route.id} has unknown waypoint ${waypoint}`)
            })
        })
    })
})
