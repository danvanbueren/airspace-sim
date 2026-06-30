import {bearingDegrees, haversineDistanceNm, offsetLngLat} from '../../../simulation/geo.js'
import {buildCircleRingCoordinates} from '../scopeCircleGeometry.js'
import {GEOMETRY_SHAPE_TYPES} from './drawGeometryTypes.js'

const ELLIPSE_SEGMENTS = 72
const RACETRACK_ARC_SEGMENTS = 24

export function deriveAxisAlignedHalfExtentsNm(center, vertex) {
    if (!center || !vertex) {
        return {halfWidthNm: 0, halfHeightNm: 0}
    }

    const halfHeightNm = haversineDistanceNm(center.lat, center.lng, vertex.lat, center.lng)
    const halfWidthNm = haversineDistanceNm(center.lat, center.lng, center.lat, vertex.lng)

    return {
        halfHeightNm,
        halfWidthNm,
    }
}

export function deriveSquareHalfSizeNm(center, vertex) {
    const {halfHeightNm, halfWidthNm} = deriveAxisAlignedHalfExtentsNm(center, vertex)

    return Math.max(halfHeightNm, halfWidthNm)
}

export function deriveCircleRadiusNm(center, edgePoint) {
    if (!center || !edgePoint) {
        return 0
    }

    return haversineDistanceNm(center.lat, center.lng, edgePoint.lat, edgePoint.lng)
}

export function deriveRacetrackRadiusNm(center1, center2, radiusPoint) {
    if (!center1 || !center2 || !radiusPoint) {
        return 0
    }

    const nearestPoint = getNearestPointOnCenterLine(center1, center2, radiusPoint)

    return haversineDistanceNm(
        nearestPoint.lat,
        nearestPoint.lng,
        radiusPoint.lat,
        radiusPoint.lng,
    )
}

export function normalizeBearingDegrees(bearing) {
    return ((bearing % 360) + 360) % 360
}

export function getRacetrackAxisBearing(center1, center2) {
    return bearingDegrees(center1.lat, center1.lng, center2.lat, center2.lng)
}

export function getRacetrackTangentPoints(center1, center2, radiusNm) {
    const axisBearing = getRacetrackAxisBearing(center1, center2)
    const sideABearing = normalizeBearingDegrees(axisBearing - 90)
    const sideBBearing = normalizeBearingDegrees(axisBearing + 90)

    return {
        axisBearing,
        sideABearing,
        sideBBearing,
        tangent1A: offsetLngLat(center1.lng, center1.lat, sideABearing, radiusNm),
        tangent2A: offsetLngLat(center2.lng, center2.lat, sideABearing, radiusNm),
        tangent2B: offsetLngLat(center2.lng, center2.lat, sideBBearing, radiusNm),
        tangent1B: offsetLngLat(center1.lng, center1.lat, sideBBearing, radiusNm),
    }
}

export function getNearestPointOnCenterLine(center1, center2, point) {
    const axisLength = haversineDistanceNm(center1.lat, center1.lng, center2.lat, center2.lng)

    if (!(axisLength > 0)) {
        return center1
    }

    const axisBearing = getRacetrackAxisBearing(center1, center2)
    const pointBearing = bearingDegrees(center1.lat, center1.lng, point.lat, point.lng)
    const pointDistance = haversineDistanceNm(center1.lat, center1.lng, point.lat, point.lng)
    const bearingDifferenceRadians = ((pointBearing - axisBearing) * Math.PI) / 180
    const alongTrackNm = pointDistance * Math.cos(bearingDifferenceRadians)
    const clampedAlongTrackNm = Math.max(0, Math.min(axisLength, alongTrackNm))

    return offsetLngLat(center1.lng, center1.lat, axisBearing, clampedAlongTrackNm)
}

export function getRacetrackMaxRadiusNm(center1, center2) {
    return haversineDistanceNm(center1.lat, center1.lng, center2.lat, center2.lng) / 2
}

function buildRectangleRing(center, halfWidthNm, halfHeightNm) {
    const north = offsetLngLat(center.lng, center.lat, 0, halfHeightNm)
    const south = offsetLngLat(center.lng, center.lat, 180, halfHeightNm)
    const northEast = offsetLngLat(north.lng, north.lat, 90, halfWidthNm)
    const northWest = offsetLngLat(north.lng, north.lat, 270, halfWidthNm)
    const southEast = offsetLngLat(south.lng, south.lat, 90, halfWidthNm)
    const southWest = offsetLngLat(south.lng, south.lat, 270, halfWidthNm)

    return [
        [northWest.lng, northWest.lat],
        [northEast.lng, northEast.lat],
        [southEast.lng, southEast.lat],
        [southWest.lng, southWest.lat],
        [northWest.lng, northWest.lat],
    ]
}

function buildOvalRing(center, halfWidthNm, halfHeightNm, segments = ELLIPSE_SEGMENTS) {
    const ring = []

    for (let index = 0; index <= segments; index += 1) {
        const angleRadians = (index / segments) * Math.PI * 2
        const eastOffset = Math.cos(angleRadians) * halfWidthNm
        const northOffset = Math.sin(angleRadians) * halfHeightNm
        const point = offsetLngLat(center.lng, center.lat, 90, eastOffset)

        ring.push(offsetLngLat(point.lng, point.lat, 0, northOffset))
    }

    return ring.map((point) => [point.lng, point.lat])
}

function appendRacetrackArc(ring, center, fromBearing, radiusNm, segments, includeStart) {
    const startIndex = includeStart ? 0 : 1

    for (let index = startIndex; index <= segments; index += 1) {
        const bearing = normalizeBearingDegrees(fromBearing + ((index / segments) * 180))
        const point = offsetLngLat(center.lng, center.lat, bearing, radiusNm)

        ring.push([point.lng, point.lat])
    }
}

function buildRacetrackRing(center1, center2, radiusNm) {
    const {
        sideABearing,
        sideBBearing,
        tangent1A,
        tangent2A,
        tangent1B,
    } = getRacetrackTangentPoints(center1, center2, radiusNm)

    const ring = [
        [tangent1A.lng, tangent1A.lat],
        [tangent2A.lng, tangent2A.lat],
    ]

    appendRacetrackArc(ring, center2, sideABearing, radiusNm, RACETRACK_ARC_SEGMENTS, false)
    ring.push([tangent1B.lng, tangent1B.lat])
    appendRacetrackArc(ring, center1, sideBBearing, radiusNm, RACETRACK_ARC_SEGMENTS, false)
    ring.push(ring[0])

    return ring
}

function buildPolygonCoordinates(vertices, closed) {
    const coordinates = vertices.map((vertex) => [vertex.lng, vertex.lat])

    if (closed && coordinates.length > 0) {
        const [firstLng, firstLat] = coordinates[0]
        const [lastLng, lastLat] = coordinates[coordinates.length - 1]

        if (firstLng !== lastLng || firstLat !== lastLat) {
            coordinates.push([firstLng, firstLat])
        }
    }

    return coordinates
}

function getNorthEdgePoint(center, northOffsetNm) {
    if (!center) {
        return null
    }

    if (!(northOffsetNm > 0)) {
        return center
    }

    return offsetLngLat(center.lng, center.lat, 0, northOffsetNm)
}

export function getGeometryDisplayTitle(shape) {
    return shape?.name?.trim() ?? ''
}

export function getGeometryLabelPoint(shape) {
    const {type, params} = shape

    switch (type) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
        case GEOMETRY_SHAPE_TYPES.OVAL:
            return getNorthEdgePoint(params.center, params.halfHeightNm)
        case GEOMETRY_SHAPE_TYPES.SQUARE:
            return getNorthEdgePoint(params.center, params.halfSizeNm)
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            return getNorthEdgePoint(params.center, params.radiusNm)
        case GEOMETRY_SHAPE_TYPES.RACETRACK: {
            if (!params.center1 || !params.center2 || !(params.radiusNm > 0)) {
                return null
            }

            const {
                tangent1A,
                tangent2A,
                tangent1B,
                tangent2B,
            } = getRacetrackTangentPoints(params.center1, params.center2, params.radiusNm)
            const northernTangent = [tangent1A, tangent2A, tangent1B, tangent2B].reduce(
                (current, tangent) => (tangent.lat > current.lat ? tangent : current),
                tangent1A,
            )

            return getNorthEdgePoint(northernTangent, 0)
        }
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            if (!params.vertices?.length) {
                return null
            }

            return params.vertices.reduce((northernVertex, vertex) => (
                vertex.lat > northernVertex.lat ? vertex : northernVertex
            ), params.vertices[0])
        default:
            return null
    }
}

export function buildGeometryFeature(shape) {
    const geometry = buildGeometryGeoJson(shape)

    if (!geometry) {
        return null
    }

    return {
        type: 'Feature',
        geometry,
        properties: {
            id: shape.id,
            shapeType: shape.type,
            status: shape.status,
            closed: Boolean(shape.params?.closed),
            opacity: shape.status === 'committed' ? 1 : 0.45,
        },
    }
}

export function buildGeometryLabelFeature(shape) {
    const labelPoint = getGeometryLabelPoint(shape)
    const labelText = getGeometryDisplayTitle(shape)

    if (!labelPoint || !labelText) {
        return null
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [labelPoint.lng, labelPoint.lat],
        },
        properties: {
            id: `${shape.id}-label`,
            shapeId: shape.id,
            label: labelText,
        },
    }
}

export function buildGeometryGeoJson(shape) {
    const {type, params} = shape

    switch (type) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
            if (!params.center || !(params.halfWidthNm > 0) || !(params.halfHeightNm > 0)) {
                return null
            }

            return {
                type: 'Polygon',
                coordinates: [buildRectangleRing(params.center, params.halfWidthNm, params.halfHeightNm)],
            }
        case GEOMETRY_SHAPE_TYPES.SQUARE:
            if (!params.center || !(params.halfSizeNm > 0)) {
                return null
            }

            return {
                type: 'Polygon',
                coordinates: [buildRectangleRing(params.center, params.halfSizeNm, params.halfSizeNm)],
            }
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            if (!params.center || !(params.radiusNm > 0)) {
                return null
            }

            return {
                type: 'Polygon',
                coordinates: [buildCircleRingCoordinates(params.center.lng, params.center.lat, params.radiusNm)],
            }
        case GEOMETRY_SHAPE_TYPES.OVAL:
            if (!params.center || !(params.halfWidthNm > 0) || !(params.halfHeightNm > 0)) {
                return null
            }

            return {
                type: 'Polygon',
                coordinates: [buildOvalRing(params.center, params.halfWidthNm, params.halfHeightNm)],
            }
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            if (!params.center1 || !params.center2 || !(params.radiusNm > 0)) {
                return null
            }

            return {
                type: 'Polygon',
                coordinates: [buildRacetrackRing(params.center1, params.center2, params.radiusNm)],
            }
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            if (!params.vertices?.length) {
                return null
            }

            return {
                type: params.closed ? 'Polygon' : 'LineString',
                coordinates: params.closed
                    ? [buildPolygonCoordinates(params.vertices, true)]
                    : buildPolygonCoordinates(params.vertices, false),
            }
        default:
            return null
    }
}

export function buildGeometryFeatureCollection(shapes) {
    const features = []

    for (const shape of shapes) {
        const feature = buildGeometryFeature(shape)

        if (feature) {
            features.push(feature)
        }

        const labelFeature = buildGeometryLabelFeature(shape)

        if (labelFeature) {
            features.push(labelFeature)
        }
    }

    return {
        type: 'FeatureCollection',
        features,
    }
}

export function canPreviewGeometry(shape) {
    return buildGeometryGeoJson(shape) !== null
}
