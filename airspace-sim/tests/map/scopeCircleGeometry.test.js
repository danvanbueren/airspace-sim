import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    buildCircleRingCoordinates,
    GROUP_CRITERIA_RADIUS_NM,
} from '../../app/tools/map/scopeCircleGeometry.js'
import {haversineDistanceNm} from '../../app/simulation/geo.js'

describe('buildCircleRingCoordinates', () => {
    it('builds a closed ring with the requested radius in nautical miles', () => {
        const centerLng = -77
        const centerLat = 38.9
        const ring = buildCircleRingCoordinates(centerLng, centerLat, GROUP_CRITERIA_RADIUS_NM)

        assert.equal(ring.length, 73)
        assert.deepEqual(ring[0], ring[ring.length - 1])

        const sampleDistance = haversineDistanceNm(
            centerLat,
            centerLng,
            ring[18][1],
            ring[18][0],
        )

        assert.ok(Math.abs(sampleDistance - GROUP_CRITERIA_RADIUS_NM) < 0.01)
    })
})
