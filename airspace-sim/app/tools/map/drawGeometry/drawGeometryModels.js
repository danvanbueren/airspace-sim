import {
    GEOMETRY_SHAPE_TYPES,
    GEOMETRY_STATUS,
    MIN_POLYGON_VERTICES,
} from './drawGeometryTypes.js'
import {getRacetrackMaxRadiusNm} from './drawGeometryGeometry.js'

function createLngLat(lat = 0, lng = 0) {
    return {lat, lng}
}

export function createDefaultParamsForType(type) {
    switch (type) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
            return {center: null, halfWidthNm: 0, halfHeightNm: 0}
        case GEOMETRY_SHAPE_TYPES.SQUARE:
            return {center: null, halfSizeNm: 0}
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            return {center: null, radiusNm: 0}
        case GEOMETRY_SHAPE_TYPES.OVAL:
            return {center: null, halfWidthNm: 0, halfHeightNm: 0}
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            return {center1: null, center2: null, radiusNm: 0}
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            return {vertices: [], closed: false, finalized: false}
        default:
            return {}
    }
}

export function createGeometryShape(type, {id = crypto.randomUUID()} = {}) {
    return {
        id,
        name: '',
        type,
        status: GEOMETRY_STATUS.PENDING,
        params: createDefaultParamsForType(type),
        createdAt: Date.now(),
        fillOpacity: 0,
    }
}

export function isGeometryShapePending(shape) {
    if (!shape || shape.status === GEOMETRY_STATUS.PENDING) {
        return true
    }

    return !isGeometryShapeComplete(shape)
}

export function isGeometryShapeInPendingDrawStatus(shape) {
    return shape?.status === GEOMETRY_STATUS.PENDING
}

export function isGeometryShapeComplete(shape) {
    if (!shape) {
        return false
    }

    const {type, params} = shape

    switch (type) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
        case GEOMETRY_SHAPE_TYPES.OVAL:
            return Boolean(
                params.center
                && params.halfWidthNm > 0
                && params.halfHeightNm > 0,
            )
        case GEOMETRY_SHAPE_TYPES.SQUARE:
            return Boolean(params.center && params.halfSizeNm > 0)
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            return Boolean(params.center && params.radiusNm > 0)
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            return Boolean(
                params.center1
                && params.center2
                && params.radiusNm > 0
                && isRacetrackRadiusValid(params),
            )
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            return Array.isArray(params.vertices)
                && params.vertices.length >= MIN_POLYGON_VERTICES
                && Boolean(params.finalized)
        default:
            return false
    }
}

export function isRacetrackRadiusValid(params) {
    if (!params.center1 || !params.center2 || !(params.radiusNm > 0)) {
        return false
    }

    const maxRadius = getRacetrackMaxRadiusNm(params.center1, params.center2)

    return params.radiusNm <= maxRadius
}

export {getRacetrackMaxRadiusNm}

export function normalizeLngLat(lngLat) {
    if (!lngLat) {
        return null
    }

    return createLngLat(lngLat.lat, lngLat.lng)
}

export function cloneGeometryShape(shape) {
    return {
        ...shape,
        params: JSON.parse(JSON.stringify(shape.params)),
    }
}
