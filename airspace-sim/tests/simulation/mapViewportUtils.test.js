import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {isPointInBounds} from '../../app/simulation/geo.js'
import {
    computeSensorScanBounds,
    filterDetectionsByBounds,
    filterTracksByBounds,
    getSensorScanAircraft,
} from '../../app/simulation/mapViewportUtils.js'

describe('wrapped map bounds', () => {
    it('matches points inside world-copy longitude bounds', () => {
        const bounds = {
            west: 160,
            south: 20,
            east: 200,
            north: 60,
        }

        assert.equal(isPointInBounds(-170, 40, bounds), true)
        assert.equal(isPointInBounds(190, 40, bounds), true)
        assert.equal(isPointInBounds(150, 40, bounds), false)
        assert.equal(isPointInBounds(-170, 40, {
            ...bounds,
            west: 520,
            east: 560,
        }), true)
        assert.equal(isPointInBounds(-175, 40, {
            ...bounds,
            west: 170,
            east: -170,
        }), true)
        assert.equal(isPointInBounds(-175, 40, {
            ...bounds,
            west: 530,
            east: 550,
        }), true)
    })

    it('filters tracks using the same wrapped longitude handling as scan bounds', () => {
        const tracks = [
            {
                id: 'pacific-track',
                longitude: -170,
                latitude: 40,
            },
            {
                id: 'outside-track',
                longitude: 150,
                latitude: 40,
            },
            {
                id: 'outside-latitude-track',
                longitude: -170,
                latitude: 70,
            },
        ]

        assert.deepEqual(
            filterTracksByBounds(tracks, {
                west: 160,
                south: 20,
                east: 200,
                north: 60,
            }).map((track) => track.id),
            ['pacific-track'],
        )
    })

    it('filters detections to display bounds for off-viewport initiation gating', () => {
        const detections = [
            {id: 'inside', longitude: -80, latitude: 40},
            {id: 'outside', longitude: -100, latitude: 40},
        ]

        assert.deepEqual(
            filterDetectionsByBounds(detections, {
                west: -85,
                south: 35,
                east: -75,
                north: 45,
            }).map((detection) => detection.id),
            ['inside'],
        )
    })

    it('always scans the global fleet', () => {
        const globalAircraft = [{id: 'global'}]
        const flightWorld = {
            getAircraftInBounds: () => [],
            getAllAircraft: () => globalAircraft,
        }

        assert.deepEqual(
            getSensorScanAircraft(flightWorld),
            globalAircraft,
        )
    })

    it('unions display bounds with a padded firm-track envelope', () => {
        const displayBounds = {west: -90, south: 30, east: -80, north: 40}
        const tracks = [{
            longitude: -100,
            latitude: 35,
        }]

        const sensorScanBounds = computeSensorScanBounds(displayBounds, tracks, 15)

        assert.ok(sensorScanBounds.west < displayBounds.west)
        assert.ok(sensorScanBounds.east >= displayBounds.east)
    })
})
