import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    convertGeometryParamsInscribed,
    convertGeometryShapeType,
} from '../../app/tools/map/drawGeometry/drawGeometryConversion.js'
import {
    buildGeometryGeoJson,
    deriveAxisAlignedHalfExtentsNm,
    deriveCircleRadiusNm,
    deriveSquareHalfSizeNm,
} from '../../app/tools/map/drawGeometry/drawGeometryGeometry.js'
import {
    createGeometryShape,
    isGeometryShapeComplete,
} from '../../app/tools/map/drawGeometry/drawGeometryModels.js'
import {GEOMETRY_SHAPE_TYPES, GEOMETRY_STATUS} from '../../app/tools/map/drawGeometry/drawGeometryTypes.js'

describe('draw geometry builders', () => {
    it('derives axis-aligned rectangle extents from center and corner', () => {
        const center = {lat: 40, lng: -75}
        const corner = {lat: 41, lng: -73}

        const extents = deriveAxisAlignedHalfExtentsNm(center, corner)

        assert.ok(extents.halfHeightNm > 0)
        assert.ok(extents.halfWidthNm > 0)
    })

    it('forces square half size to the larger axis extent', () => {
        const center = {lat: 40, lng: -75}
        const corner = {lat: 41, lng: -73}
        const extents = deriveAxisAlignedHalfExtentsNm(center, corner)

        assert.equal(
            deriveSquareHalfSizeNm(center, corner),
            Math.max(extents.halfHeightNm, extents.halfWidthNm),
        )
    })

    it('builds circle geometry from center and radius', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.CIRCLE)
        shape.params = {
            center: {lat: 40, lng: -75},
            radiusNm: 10,
        }
        shape.status = GEOMETRY_STATUS.COMMITTED

        const geometry = buildGeometryGeoJson(shape)

        assert.equal(geometry.type, 'Polygon')
        assert.ok(geometry.coordinates[0].length > 4)
        assert.equal(isGeometryShapeComplete(shape), true)
    })

    it('derives circle radius from center and edge point', () => {
        const center = {lat: 40, lng: -75}
        const edge = {lat: 41, lng: -75}

        assert.ok(deriveCircleRadiusNm(center, edge) > 0)
    })
})

describe('draw geometry inscribed conversion', () => {
    it('converts rectangle to inscribed circle', () => {
        const converted = convertGeometryParamsInscribed(
            GEOMETRY_SHAPE_TYPES.RECTANGLE,
            {center: {lat: 0, lng: 0}, halfWidthNm: 10, halfHeightNm: 5},
            GEOMETRY_SHAPE_TYPES.CIRCLE,
        )

        assert.equal(converted.radiusNm, 5)
    })

    it('converts shape type through convertGeometryShapeType helper', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.RECTANGLE)
        shape.params = {
            center: {lat: 0, lng: 0},
            halfWidthNm: 8,
            halfHeightNm: 4,
        }

        const converted = convertGeometryShapeType(shape, GEOMETRY_SHAPE_TYPES.CIRCLE)

        assert.equal(converted.type, GEOMETRY_SHAPE_TYPES.CIRCLE)
        assert.equal(converted.params.radiusNm, 4)
    })
})
