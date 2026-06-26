import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    calculateBearingAndRange,
    createBearingRangeLine,
    getLabelLongitudeCopies,
    getLineWorldCopyOffsets,
    isEndpointNormalized,
    normalizeLongitudeToShortestPath,
} from '../../app/tools/map/bearingRangeGeometry.js'

describe('bearingRangeGeometry', () => {
    it('normalizes longitude across the antimeridian on the short path', () => {
        assert.equal(normalizeLongitudeToShortestPath(170, -170), 190)
        assert.equal(normalizeLongitudeToShortestPath(-170, 170), -190)
    })

    it('detects when an endpoint was normalized', () => {
        assert.equal(
            isEndpointNormalized({lng: 170, lat: 0}, {lng: -170, lat: 0}),
            true,
        )
        assert.equal(
            isEndpointNormalized({lng: 10, lat: 0}, {lng: 20, lat: 0}),
            false,
        )
    })

    it('creates a line with normalized end coordinates and bearing/range', () => {
        const line = createBearingRangeLine(
            {
                lngLat: {lng: 0, lat: 0},
                point: {x: 0, y: 0},
                mapPoint: {x: 100, y: 100},
            },
            {
                lngLat: {lng: 1, lat: 1},
                point: {x: 10, y: 10},
                mapPoint: {x: 200, y: 200},
            },
        )

        assert.equal(line.start.lng, 0)
        assert.equal(line.end.lng, 1)
        assert.equal(line.end.lat, 1)
        assert.ok(line.bearingDegrees >= 0 && line.bearingDegrees < 360)
        assert.ok(line.rangeNauticalMiles > 0)
    })

    it('calculates eastward bearing for a simple east drag', () => {
        const result = calculateBearingAndRange(
            {lng: 0, lat: 0},
            {lng: 1, lat: 0},
        )

        assert.equal(Math.round(result.bearingDegrees), 90)
        assert.ok(result.rangeNauticalMiles > 0)
    })

    it('includes the primary world copy when the line is in view', () => {
        const line = createBearingRangeLine(
            {lngLat: {lng: 0, lat: 0}, point: {x: 0, y: 0}, mapPoint: {x: 0, y: 0}},
            {lngLat: {lng: 10, lat: 0}, point: {x: 1, y: 1}, mapPoint: {x: 1, y: 1}},
        )

        const offsets = getLineWorldCopyOffsets(line, -30, 30)

        assert.ok(offsets.includes(0))
    })

    it('returns multiple label longitudes at world scale', () => {
        const copies = getLabelLongitudeCopies(0, -200, 200)

        assert.ok(copies.length >= 3)
        assert.ok(copies.includes(0))
        assert.ok(copies.includes(360))
        assert.ok(copies.includes(-360))
    })
})
