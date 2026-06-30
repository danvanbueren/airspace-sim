import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    convertGeometryParamsInscribed,
    convertGeometryShapeType,
} from '../../app/tools/map/drawGeometry/drawGeometryConversion.js'
import {
    buildGeometryFeature,
    buildGeometryGeoJson,
    buildGeometryLabelFeature,
    deriveAxisAlignedHalfExtentsNm,
    deriveCircleRadiusNm,
    deriveRacetrackRadiusNm,
    deriveSquareHalfSizeNm,
    getNearestPointOnCenterLine,
    getRacetrackAxisBearing,
    getRacetrackTangentPoints,
    normalizeBearingDegrees,
} from '../../app/tools/map/drawGeometry/drawGeometryGeometry.js'
import {bearingDegrees} from '../../app/simulation/geo.js'
import {
    createGeometryShape,
    isGeometryShapeComplete,
    isGeometryShapeInPendingDrawStatus,
} from '../../app/tools/map/drawGeometry/drawGeometryModels.js'
import {GEOMETRY_SHAPE_TYPES, GEOMETRY_STATUS} from '../../app/tools/map/drawGeometry/drawGeometryTypes.js'

function bearingDifferenceDegrees(leftBearing, rightBearing) {
    const difference = Math.abs(normalizeBearingDegrees(leftBearing) - normalizeBearingDegrees(rightBearing))

    return Math.min(difference, 360 - difference)
}

function assertBearingsApproximatelyEqual(actualBearing, expectedBearing, toleranceDegrees = 1) {
    assert.ok(
        bearingDifferenceDegrees(actualBearing, expectedBearing) <= toleranceDegrees,
        `expected bearing ${expectedBearing}, received ${actualBearing}`,
    )
}

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

    it('builds a stadium-shaped horizontal racetrack with straight sides', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.RACETRACK)
        shape.params = {
            center1: {lat: 40, lng: -80},
            center2: {lat: 40, lng: -70},
            radiusNm: 5,
        }
        shape.status = GEOMETRY_STATUS.COMMITTED

        const geometry = buildGeometryGeoJson(shape)
        const ring = geometry.coordinates[0]
        const axisBearing = getRacetrackAxisBearing(shape.params.center1, shape.params.center2)
        const tangents = getRacetrackTangentPoints(
            shape.params.center1,
            shape.params.center2,
            shape.params.radiusNm,
        )

        assert.equal(geometry.type, 'Polygon')
        assert.ok(ring.length > 40)
        assert.equal(ring[0][0], ring[ring.length - 1][0])
        assert.equal(ring[0][1], ring[ring.length - 1][1])
        assertBearingsApproximatelyEqual(
            bearingDegrees(
                tangents.tangent1A.lat,
                tangents.tangent1A.lng,
                tangents.tangent2A.lat,
                tangents.tangent2A.lng,
            ),
            axisBearing,
        )
        assertBearingsApproximatelyEqual(
            bearingDegrees(
                shape.params.center1.lat,
                shape.params.center1.lng,
                tangents.tangent1A.lat,
                tangents.tangent1A.lng,
            ),
            normalizeBearingDegrees(axisBearing - 90),
        )
    })

    it('builds a rotated racetrack with straights parallel to the center axis', () => {
        const center1 = {lat: 40, lng: -80}
        const center2 = {lat: 41, lng: -78}
        const radiusNm = 5
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.RACETRACK)
        shape.params = {center1, center2, radiusNm}
        shape.status = GEOMETRY_STATUS.COMMITTED

        const geometry = buildGeometryGeoJson(shape)
        const axisBearing = getRacetrackAxisBearing(center1, center2)
        const tangents = getRacetrackTangentPoints(center1, center2, radiusNm)

        assert.equal(geometry.type, 'Polygon')
        assertBearingsApproximatelyEqual(
            bearingDegrees(
                tangents.tangent1A.lat,
                tangents.tangent1A.lng,
                tangents.tangent2A.lat,
                tangents.tangent2A.lng,
            ),
            axisBearing,
        )
        assertBearingsApproximatelyEqual(
            bearingDegrees(
                tangents.tangent1B.lat,
                tangents.tangent1B.lng,
                tangents.tangent2B.lat,
                tangents.tangent2B.lng,
            ),
            axisBearing,
        )
        assertBearingsApproximatelyEqual(
            bearingDegrees(center1.lat, center1.lng, tangents.tangent1A.lat, tangents.tangent1A.lng),
            normalizeBearingDegrees(axisBearing - 90),
        )
        assertBearingsApproximatelyEqual(
            bearingDegrees(center2.lat, center2.lng, tangents.tangent2B.lat, tangents.tangent2B.lng),
            normalizeBearingDegrees(axisBearing + 90),
        )
    })

    it('derives racetrack radius perpendicular to the center axis', () => {
        const center1 = {lat: 40, lng: -80}
        const center2 = {lat: 41, lng: -78}
        const radiusPoint = getRacetrackTangentPoints(center1, center2, 7).tangent1A
        const nearestPoint = getNearestPointOnCenterLine(center1, center2, radiusPoint)

        assert.ok(deriveRacetrackRadiusNm(center1, center2, radiusPoint) > 6.5)
        assert.ok(
            bearingDifferenceDegrees(
                getRacetrackAxisBearing(center1, center2),
                bearingDegrees(nearestPoint.lat, nearestPoint.lng, radiusPoint.lat, radiusPoint.lng),
            ) >= 89,
        )
    })

    it('keeps shape labels off polygon features', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.RECTANGLE)
        shape.name = 'ahh!'
        shape.params = {
            center: {lat: 40, lng: -75},
            halfWidthNm: 10,
            halfHeightNm: 5,
        }
        shape.status = GEOMETRY_STATUS.COMMITTED

        const feature = buildGeometryFeature(shape)
        const labelFeature = buildGeometryLabelFeature(shape)

        assert.equal(feature.properties.name, undefined)
        assert.equal(labelFeature.properties.label, 'ahh!')
        assert.equal(labelFeature.properties.name, undefined)
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

describe('draw geometry pending draw status', () => {
    it('tracks pending draw status separately from incomplete committed shapes', () => {
        const pendingShape = createGeometryShape(GEOMETRY_SHAPE_TYPES.CIRCLE)

        assert.equal(isGeometryShapeInPendingDrawStatus(pendingShape), true)

        pendingShape.status = GEOMETRY_STATUS.COMMITTED

        assert.equal(isGeometryShapeInPendingDrawStatus(pendingShape), false)
    })
})
