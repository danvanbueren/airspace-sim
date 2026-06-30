import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    buildDisplayGeometryGeoJson,
    buildGeometryGeoJson,
} from '../../app/tools/map/drawGeometry/drawGeometryGeometry.js'
import {
    clampCircleRadiusToMapBounds,
    clampLngLatToMapDisplayBounds,
    clipGeometryToMapDisplayBounds,
    isCoordinateInsideMapDisplayBounds,
    MAP_DISPLAY_MAX_LATITUDE,
    MAP_DISPLAY_MIN_LATITUDE,
} from '../../app/tools/map/drawGeometry/drawGeometryMapBounds.js'
import {createGeometryShape} from '../../app/tools/map/drawGeometry/drawGeometryModels.js'
import {GEOMETRY_SHAPE_TYPES, GEOMETRY_STATUS} from '../../app/tools/map/drawGeometry/drawGeometryTypes.js'

describe('draw geometry map bounds', () => {
    it('clamps clicked coordinates to the usable map latitude range', () => {
        const clamped = clampLngLatToMapDisplayBounds({lat: 89, lng: 200})

        assert.equal(clamped.lat, MAP_DISPLAY_MAX_LATITUDE)
        assert.equal(clamped.lng, -160)
    })

    it('limits circle radius so the edge stays inside map bounds', () => {
        const center = {lat: 84, lng: 0}
        const clampedRadius = clampCircleRadiusToMapBounds(center, 500)

        assert.ok(clampedRadius > 0)
        assert.ok(clampedRadius <= 120)
    })

    it('clips polygon geometry that extends beyond the map bounds', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.RECTANGLE)
        shape.params = {
            center: {lat: 84, lng: 0},
            halfWidthNm: 100,
            halfHeightNm: 100,
        }
        shape.status = GEOMETRY_STATUS.COMMITTED

        const rawGeometry = buildGeometryGeoJson(shape)
        const clippedGeometry = buildDisplayGeometryGeoJson(shape)

        assert.ok(rawGeometry)
        assert.ok(clippedGeometry)
        assert.equal(clippedGeometry.type, 'Polygon')

        const lats = clippedGeometry.coordinates[0].map(([, lat]) => lat)

        assert.ok(lats.every((lat) => lat <= MAP_DISPLAY_MAX_LATITUDE))
        assert.ok(lats.every((lat) => lat >= MAP_DISPLAY_MIN_LATITUDE))
    })

    it('hides geometry that falls completely outside map bounds', () => {
        const geometry = clipGeometryToMapDisplayBounds({
            type: 'Point',
            coordinates: [0, 89],
        })

        assert.equal(geometry, null)
    })

    it('clips open line geometry at the map edge instead of drawing through', () => {
        const geometry = clipGeometryToMapDisplayBounds({
            type: 'LineString',
            coordinates: [
                [0, 0],
                [0, MAP_DISPLAY_MAX_LATITUDE + 5],
            ],
        })

        assert.equal(geometry.type, 'LineString')
        assert.equal(geometry.coordinates.length, 2)
        assert.ok(isCoordinateInsideMapDisplayBounds(
            geometry.coordinates[1][0],
            geometry.coordinates[1][1],
        ))
        assert.ok(geometry.coordinates[1][1] <= MAP_DISPLAY_MAX_LATITUDE)
    })
})
