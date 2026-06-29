import {GEOMETRY_SHAPE_TYPES} from './drawGeometryTypes.js'
import {createDefaultParamsForType} from './drawGeometryModels.js'
import {getRacetrackMaxRadiusNm} from './drawGeometryGeometry.js'

function clampRacetrackRadius(center1, center2, radiusNm) {
    const maxRadius = getRacetrackMaxRadiusNm(center1, center2)

    return Math.min(Math.max(radiusNm, 0), maxRadius)
}

export function convertGeometryParamsInscribed(fromType, fromParams, toType) {
    if (fromType === toType) {
        return {...fromParams}
    }

    switch (toType) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
            return convertToRectangle(fromType, fromParams)
        case GEOMETRY_SHAPE_TYPES.SQUARE:
            return convertToSquare(fromType, fromParams)
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            return convertToCircle(fromType, fromParams)
        case GEOMETRY_SHAPE_TYPES.OVAL:
            return convertToOval(fromType, fromParams)
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            return convertToRacetrack(fromType, fromParams)
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            return convertToPolygon(fromType, fromParams)
        default:
            return createDefaultParamsForType(toType)
    }
}

function convertToRectangle(fromType, fromParams) {
    switch (fromType) {
        case GEOMETRY_SHAPE_TYPES.SQUARE:
            return {
                center: fromParams.center,
                halfWidthNm: fromParams.halfSizeNm,
                halfHeightNm: fromParams.halfSizeNm,
            }
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            return {
                center: fromParams.center,
                halfWidthNm: fromParams.radiusNm / Math.SQRT2,
                halfHeightNm: fromParams.radiusNm / Math.SQRT2,
            }
        case GEOMETRY_SHAPE_TYPES.OVAL:
            return {
                center: fromParams.center,
                halfWidthNm: fromParams.halfWidthNm,
                halfHeightNm: fromParams.halfHeightNm,
            }
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            return racetrackToRectangle(fromParams)
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            return polygonBoundsToRectangle(fromParams)
        default:
            return {...fromParams}
    }
}

function convertToSquare(fromType, fromParams) {
    const rectangle = convertToRectangle(fromType, fromParams)

    return {
        center: rectangle.center,
        halfSizeNm: Math.min(rectangle.halfWidthNm ?? 0, rectangle.halfHeightNm ?? 0),
    }
}

function convertToCircle(fromType, fromParams) {
    switch (fromType) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
        case GEOMETRY_SHAPE_TYPES.OVAL:
            return {
                center: fromParams.center,
                radiusNm: Math.min(fromParams.halfWidthNm ?? 0, fromParams.halfHeightNm ?? 0),
            }
        case GEOMETRY_SHAPE_TYPES.SQUARE:
            return {
                center: fromParams.center,
                radiusNm: fromParams.halfSizeNm,
            }
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            return {
                center: midpoint(fromParams.center1, fromParams.center2),
                radiusNm: fromParams.radiusNm,
            }
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            return polygonBoundsToCircle(fromParams)
        default:
            return {...fromParams}
    }
}

function convertToOval(fromType, fromParams) {
    switch (fromType) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
            return {
                center: fromParams.center,
                halfWidthNm: fromParams.halfWidthNm,
                halfHeightNm: fromParams.halfHeightNm,
            }
        case GEOMETRY_SHAPE_TYPES.SQUARE:
            return {
                center: fromParams.center,
                halfWidthNm: fromParams.halfSizeNm,
                halfHeightNm: fromParams.halfSizeNm,
            }
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            return {
                center: fromParams.center,
                halfWidthNm: fromParams.radiusNm,
                halfHeightNm: fromParams.radiusNm,
            }
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            return racetrackToOval(fromParams)
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            return polygonBoundsToOval(fromParams)
        default:
            return {...fromParams}
    }
}

function convertToRacetrack(fromType, fromParams) {
    switch (fromType) {
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            return {
                center1: offsetCenter(fromParams.center, -fromParams.radiusNm, 0),
                center2: offsetCenter(fromParams.center, fromParams.radiusNm, 0),
                radiusNm: fromParams.radiusNm,
            }
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
        case GEOMETRY_SHAPE_TYPES.SQUARE:
        case GEOMETRY_SHAPE_TYPES.OVAL:
            return rectangleLikeToRacetrack(fromParams)
        case GEOMETRY_SHAPE_TYPES.POLYGON: {
            const bounds = getPolygonBounds(fromParams.vertices ?? [])

            return {
                center1: {lat: bounds.center.lat, lng: bounds.westLng},
                center2: {lat: bounds.center.lat, lng: bounds.eastLng},
                radiusNm: Math.min(bounds.halfWidthNm, bounds.halfHeightNm),
            }
        }
        default:
            return {...fromParams}
    }
}

function convertToPolygon(fromType, fromParams) {
    switch (fromType) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE: {
            const {center, halfWidthNm, halfHeightNm} = fromParams

            return {
                vertices: buildRectangleVertices(center, halfWidthNm, halfHeightNm),
                closed: true,
            }
        }
        case GEOMETRY_SHAPE_TYPES.SQUARE: {
            const {center, halfSizeNm} = fromParams

            return {
                vertices: buildRectangleVertices(center, halfSizeNm, halfSizeNm),
                closed: true,
            }
        }
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            return {
                vertices: buildCircleVertices(fromParams.center, fromParams.radiusNm),
                closed: true,
            }
        case GEOMETRY_SHAPE_TYPES.OVAL:
            return {
                vertices: buildOvalVertices(fromParams.center, fromParams.halfWidthNm, fromParams.halfHeightNm),
                closed: true,
            }
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            return {
                vertices: buildRacetrackVertices(fromParams.center1, fromParams.center2, fromParams.radiusNm),
                closed: true,
            }
        default:
            return {
                vertices: [...(fromParams.vertices ?? [])],
                closed: Boolean(fromParams.closed),
            }
    }
}

function midpoint(first, second) {
    return {
        lat: (first.lat + second.lat) / 2,
        lng: (first.lng + second.lng) / 2,
    }
}

function offsetCenter(center, eastNm, northNm) {
    return {
        lat: center.lat + (northNm / 60),
        lng: center.lng + (eastNm / (60 * Math.cos((center.lat * Math.PI) / 180))),
    }
}

function racetrackToRectangle(params) {
    const center = midpoint(params.center1, params.center2)
    const halfWidthNm = Math.abs(params.center2.lng - params.center1.lng) / 2 * 60
    const halfHeightNm = params.radiusNm

    return {center, halfWidthNm, halfHeightNm}
}

function racetrackToOval(params) {
    const center = midpoint(params.center1, params.center2)

    return {
        center,
        halfWidthNm: Math.abs(params.center2.lng - params.center1.lng) / 2 * 60,
        halfHeightNm: params.radiusNm,
    }
}

function rectangleLikeToRacetrack(params) {
    const center = params.center
    const halfWidthNm = params.halfWidthNm ?? params.halfSizeNm ?? 0
    const halfHeightNm = params.halfHeightNm ?? params.halfSizeNm ?? 0

    return {
        center1: offsetCenter(center, -halfWidthNm, 0),
        center2: offsetCenter(center, halfWidthNm, 0),
        radiusNm: clampRacetrackRadius(
            offsetCenter(center, -halfWidthNm, 0),
            offsetCenter(center, halfWidthNm, 0),
            halfHeightNm,
        ),
    }
}

function getPolygonBounds(vertices) {
    if (!vertices.length) {
        return {
            center: {lat: 0, lng: 0},
            halfWidthNm: 0,
            halfHeightNm: 0,
            westLng: 0,
            eastLng: 0,
        }
    }

    const lats = vertices.map((vertex) => vertex.lat)
    const lngs = vertices.map((vertex) => vertex.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const center = {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2,
    }

    return {
        center,
        halfWidthNm: Math.abs(maxLng - minLng) / 2 * 60,
        halfHeightNm: Math.abs(maxLat - minLat) / 2 * 60,
        westLng: minLng,
        eastLng: maxLng,
    }
}

function polygonBoundsToRectangle(params) {
    const bounds = getPolygonBounds(params.vertices ?? [])

    return {
        center: bounds.center,
        halfWidthNm: bounds.halfWidthNm,
        halfHeightNm: bounds.halfHeightNm,
    }
}

function polygonBoundsToCircle(params) {
    const bounds = getPolygonBounds(params.vertices ?? [])

    return {
        center: bounds.center,
        radiusNm: Math.min(bounds.halfWidthNm, bounds.halfHeightNm),
    }
}

function polygonBoundsToOval(params) {
    const bounds = getPolygonBounds(params.vertices ?? [])

    return {
        center: bounds.center,
        halfWidthNm: bounds.halfWidthNm,
        halfHeightNm: bounds.halfHeightNm,
    }
}

function buildRectangleVertices(center, halfWidthNm, halfHeightNm) {
    return [
        offsetCenter(center, -halfWidthNm, halfHeightNm),
        offsetCenter(center, halfWidthNm, halfHeightNm),
        offsetCenter(center, halfWidthNm, -halfHeightNm),
        offsetCenter(center, -halfWidthNm, -halfHeightNm),
    ]
}

function buildCircleVertices(center, radiusNm, segments = 16) {
    const vertices = []

    for (let index = 0; index < segments; index += 1) {
        const bearing = (index / segments) * 360
        const radians = (bearing * Math.PI) / 180
        const eastNm = Math.sin(radians) * radiusNm
        const northNm = Math.cos(radians) * radiusNm

        vertices.push(offsetCenter(center, eastNm, northNm))
    }

    return vertices
}

function buildOvalVertices(center, halfWidthNm, halfHeightNm, segments = 24) {
    const vertices = []

    for (let index = 0; index < segments; index += 1) {
        const angleRadians = (index / segments) * Math.PI * 2
        const eastNm = Math.cos(angleRadians) * halfWidthNm
        const northNm = Math.sin(angleRadians) * halfHeightNm

        vertices.push(offsetCenter(center, eastNm, northNm))
    }

    return vertices
}

function buildRacetrackVertices(center1, center2, radiusNm) {
    const latDelta = Math.abs(center1.lat - center2.lat)
    const lngDelta = Math.abs(center1.lng - center2.lng)

    if (latDelta <= lngDelta) {
        const leftCenter = center1.lng <= center2.lng ? center1 : center2
        const rightCenter = center1.lng <= center2.lng ? center2 : center1

        return [
            offsetCenter(leftCenter, 0, radiusNm),
            offsetCenter(rightCenter, 0, radiusNm),
            offsetCenter(rightCenter, 0, -radiusNm),
            offsetCenter(leftCenter, 0, -radiusNm),
        ]
    }

    const bottomCenter = center1.lat <= center2.lat ? center1 : center2
    const topCenter = center1.lat <= center2.lat ? center2 : center1

    return [
        offsetCenter(topCenter, -radiusNm, 0),
        offsetCenter(topCenter, radiusNm, 0),
        offsetCenter(bottomCenter, radiusNm, 0),
        offsetCenter(bottomCenter, -radiusNm, 0),
    ]
}

export function convertGeometryShapeType(shape, nextType) {
    return {
        ...shape,
        type: nextType,
        status: shape.status,
        params: convertGeometryParamsInscribed(shape.type, shape.params, nextType),
    }
}
