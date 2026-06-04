import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {describe, it} from 'node:test'

async function readJson(relativePath) {
    const url = new URL(relativePath, import.meta.url)
    const contents = await readFile(url, 'utf8')

    return JSON.parse(contents)
}

describe('flight world data', () => {
    it('contains valid routes with known airports', async () => {
        const airports = await readJson('../../app/data/airports.json')
        const routes = await readJson('../../app/data/airRoutes.json')
        const airportIds = new Set(airports.map((airport) => airport.icao))

        assert.ok(airports.length > 0, 'expected at least one airport')
        assert.ok(routes.length > 0, 'expected at least one route')

        routes.forEach((route) => {
            assert.ok(airportIds.has(route.origin), `${route.id} has unknown origin`)
            assert.ok(airportIds.has(route.destination), `${route.id} has unknown destination`)

            const waypoints = route.waypoints ?? []

            waypoints.forEach((waypoint) => {
                assert.ok(airportIds.has(waypoint), `${route.id} has unknown waypoint ${waypoint}`)
            })
        })
    })
})
