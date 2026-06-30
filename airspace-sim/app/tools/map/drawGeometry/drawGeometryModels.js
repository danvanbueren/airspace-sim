import {
    GEOMETRY_SHAPE_TYPES,
    GEOMETRY_STATUS,
    MIN_POLYGON_VERTICES,
} from './drawGeometryTypes.js'
import {getRacetrackMaxRadiusNm} from './drawGeometryGeometry.js'
import {clampLngLatToMapDisplayBounds} from './drawGeometryMapBounds.js'
import {roundGeometryDrawOffsetNm} from './drawGeometryRounding.js'

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

const GEOMETRY_SYSTEM_ID_PREFIX = 'GEO-'
const GEOMETRY_SYSTEM_ID_PATTERN = /^GEO-(\d+)$/

export function createGeometrySystemId(existingShapes = []) {
    let maxNumber = 0

    for (const shape of existingShapes) {
        const match = GEOMETRY_SYSTEM_ID_PATTERN.exec(shape.id)

        if (match) {
            maxNumber = Math.max(maxNumber, Number.parseInt(match[1], 10))
        }
    }

    return `${GEOMETRY_SYSTEM_ID_PREFIX}${maxNumber + 1}`
}

export function createGeometryShape(type, {id, existingShapes = []} = {}) {
    return {
        id: id ?? createGeometrySystemId(existingShapes),
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

export function shouldAutoCommitPendingGeometryShape(shape, activeShapeId) {
    if (!shape || shape.status !== GEOMETRY_STATUS.PENDING || !isGeometryShapeComplete(shape)) {
        return false
    }

    return shape.id !== activeShapeId
}

export function isRacetrackRadiusValid(params) {
    if (!params.center1 || !params.center2 || !(params.radiusNm > 0)) {
        return false
    }

    const maxRadius = getRacetrackMaxRadiusNm(params.center1, params.center2)
    const radiusNm = roundGeometryDrawOffsetNm(params.radiusNm)
    const maxRounded = roundGeometryDrawOffsetNm(maxRadius)

    return radiusNm > 0 && radiusNm <= maxRounded
}

export {getRacetrackMaxRadiusNm}

export function normalizeLngLat(lngLat) {
    if (!lngLat) {
        return null
    }

    return clampLngLatToMapDisplayBounds(createLngLat(lngLat.lat, lngLat.lng))
}

export function cloneGeometryShape(shape) {
    return {
        ...shape,
        params: JSON.parse(JSON.stringify(shape.params)),
    }
}
