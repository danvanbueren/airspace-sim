import {haversineDistanceNm, offsetLngLat} from '../../../simulation/geo.js'
import {buildCircleRingCoordinates} from '../scopeCircleGeometry.js'
import {GEOMETRY_SHAPE_TYPES} from './drawGeometryTypes.js'

const ELLIPSE_SEGMENTS = 72
const RACETRACK_ARC_SEGMENTS = 24

export function deriveAxisAlignedHalfExtentsNm(center, vertex) {
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
    return haversineDistanceNm(center.lat, center.lng, edgePoint.lat, edgePoint.lng)
}

export function deriveRacetrackRadiusNm(center1, center2, radiusPoint) {
    const nearestPoint = getNearestPointOnCenterLine(center1, center2, radiusPoint)

    return haversineDistanceNm(
        nearestPoint.lat,
        nearestPoint.lng,
        radiusPoint.lat,
        radiusPoint.lng,
    )
}

export function getNearestPointOnCenterLine(center1, center2, point) {
    const latDelta = Math.abs(center1.lat - center2.lat)
    const lngDelta = Math.abs(center1.lng - center2.lng)

    if (latDelta <= lngDelta) {
        const minLng = Math.min(center1.lng, center2.lng)
        const maxLng = Math.max(center1.lng, center2.lng)
        const clampedLng = Math.max(minLng, Math.min(maxLng, point.lng))

        return {lat: center1.lat, lng: clampedLng}
    }

    const minLat = Math.min(center1.lat, center2.lat)
    const maxLat = Math.max(center1.lat, center2.lat)
    const clampedLat = Math.max(minLat, Math.min(maxLat, point.lat))

    return {lat: clampedLat, lng: center1.lng}
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

function buildHorizontalRacetrackRing(leftCenter, rightCenter, radiusNm) {
    const ring = []

    for (let index = 0; index <= RACETRACK_ARC_SEGMENTS; index += 1) {
        const bearing = 90 + ((index / RACETRACK_ARC_SEGMENTS) * 180)
        const point = offsetLngLat(leftCenter.lng, leftCenter.lat, bearing, radiusNm)

        ring.push([point.lng, point.lat])
    }

    for (let index = 0; index <= RACETRACK_ARC_SEGMENTS; index += 1) {
        const bearing = 270 + ((index / RACETRACK_ARC_SEGMENTS) * 180)
        const point = offsetLngLat(rightCenter.lng, rightCenter.lat, bearing, radiusNm)

        ring.push([point.lng, point.lat])
    }

    ring.push(ring[0])

    return ring
}

function buildVerticalRacetrackRing(bottomCenter, topCenter, radiusNm) {
    const ring = []

    for (let index = 0; index <= RACETRACK_ARC_SEGMENTS; index += 1) {
        const bearing = 0 + ((index / RACETRACK_ARC_SEGMENTS) * 180)
        const point = offsetLngLat(topCenter.lng, topCenter.lat, bearing, radiusNm)

        ring.push([point.lng, point.lat])
    }

    for (let index = 0; index <= RACETRACK_ARC_SEGMENTS; index += 1) {
        const bearing = 180 + ((index / RACETRACK_ARC_SEGMENTS) * 180)
        const point = offsetLngLat(bottomCenter.lng, bottomCenter.lat, bearing, radiusNm)

        ring.push([point.lng, point.lat])
    }

    ring.push(ring[0])

    return ring
}

function buildRacetrackRing(center1, center2, radiusNm) {
    const latDelta = Math.abs(center1.lat - center2.lat)
    const lngDelta = Math.abs(center1.lng - center2.lng)

    if (latDelta <= lngDelta) {
        const leftCenter = center1.lng <= center2.lng ? center1 : center2
        const rightCenter = center1.lng <= center2.lng ? center2 : center1

        return buildHorizontalRacetrackRing(leftCenter, rightCenter, radiusNm)
    }

    const bottomCenter = center1.lat <= center2.lat ? center1 : center2
    const topCenter = center1.lat <= center2.lat ? center2 : center1

    return buildVerticalRacetrackRing(bottomCenter, topCenter, radiusNm)
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

export function getGeometryLabelPoint(shape) {
    const {type, params} = shape

    switch (type) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
        case GEOMETRY_SHAPE_TYPES.SQUARE:
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
        case GEOMETRY_SHAPE_TYPES.OVAL:
            return params.center
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            if (!params.center1 || !params.center2) {
                return params.center1 ?? params.center2
            }

            return {
                lat: (params.center1.lat + params.center2.lat) / 2,
                lng: (params.center1.lng + params.center2.lng) / 2,
            }
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            if (!params.vertices?.length) {
                return null
            }

            return {
                lat: params.vertices.reduce((sum, vertex) => sum + vertex.lat, 0) / params.vertices.length,
                lng: params.vertices.reduce((sum, vertex) => sum + vertex.lng, 0) / params.vertices.length,
            }
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
            name: shape.name ?? '',
            closed: Boolean(shape.params?.closed),
            opacity: shape.status === 'committed' ? 1 : 0.45,
        },
    }
}

export function buildGeometryLabelFeature(shape) {
    const labelPoint = getGeometryLabelPoint(shape)

    if (!shape.name?.trim() || !labelPoint) {
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
            name: shape.name.trim(),
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
