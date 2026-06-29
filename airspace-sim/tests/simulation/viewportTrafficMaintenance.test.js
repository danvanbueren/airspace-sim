import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    boundsOverlap,
    polylineIntersectsBounds,
} from '../../app/simulation/routeBoundsUtils.js'

const viewportBounds = {
    west: -95,
    south: 35,
    east: -85,
    north: 45,
}

describe('viewportTrafficMaintenance', () => {
    it('detects when a route polyline intersects viewport bounds', () => {
        assert.equal(polylineIntersectsBounds(
            [
                {lng: -87.9, lat: 41.9},
                {lng: -84.4, lat: 33.6},
            ],
            viewportBounds,
        ), true)
    })

    it('detects when only the route envelope crosses the viewport', () => {
        assert.equal(polylineIntersectsBounds(
            [
                {lng: -100, lat: 40},
                {lng: -70, lat: 40},
            ],
            viewportBounds,
        ), true)
    })

    it('returns false when a route is completely outside the viewport', () => {
        assert.equal(polylineIntersectsBounds(
            [
                {lng: -120, lat: 10},
                {lng: -110, lat: 12},
            ],
            viewportBounds,
        ), false)
    })

    it('overlaps identical bounds', () => {
        assert.equal(boundsOverlap(viewportBounds, viewportBounds), true)
    })
})
