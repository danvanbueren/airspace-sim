import {offsetLngLat} from '../../../simulation/geo.js'

/** Web Mercator / MapLibre usable latitude range. */
export const MAP_DISPLAY_MAX_LATITUDE = 85.0511287798
export const MAP_DISPLAY_MIN_LATITUDE = -MAP_DISPLAY_MAX_LATITUDE

const MAP_DISPLAY_WEST_LONGITUDE = -180
const MAP_DISPLAY_EAST_LONGITUDE = 180
const MAX_EXTENT_SEARCH_NM = 10800
const EXTENT_SEARCH_TOLERANCE_NM = 0.5

export function normalizeDisplayLongitude(lng) {
    if (!Number.isFinite(lng)) {
        return 0
    }

    return ((((lng + 180) % 360) + 360) % 360) - 180
}

export function clampDisplayLatitude(lat) {
    if (!Number.isFinite(lat)) {
        return 0
    }

    return Math.max(MAP_DISPLAY_MIN_LATITUDE, Math.min(MAP_DISPLAY_MAX_LATITUDE, lat))
}

export function clampLngLatToMapDisplayBounds(lngLat) {
    if (!lngLat) {
        return null
    }

    return {
        lng: normalizeDisplayLongitude(lngLat.lng),
        lat: clampDisplayLatitude(lngLat.lat),
    }
}

export function isCoordinateInsideMapDisplayBounds(lng, lat) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        return false
    }

    return lat >= MAP_DISPLAY_MIN_LATITUDE
        && lat <= MAP_DISPLAY_MAX_LATITUDE
        && lng >= MAP_DISPLAY_WEST_LONGITUDE
        && lng <= MAP_DISPLAY_EAST_LONGITUDE
}

export function isMapLocationVisible(map, lng, lat) {
    if (!isCoordinateInsideMapDisplayBounds(lng, lat)) {
        return false
    }

    if (map?.transform?.isLocationOccluded) {
        return !map.transform.isLocationOccluded({lng, lat})
    }

    return true
}

function getFirstExitDistanceNm(center, bearingDegrees) {
    if (!center || !isCoordinateInsideMapDisplayBounds(center.lng, center.lat)) {
        return 0
    }

    let lastInsideNm = 0
    let stepNm = 1

    while (lastInsideNm + stepNm <= MAX_EXTENT_SEARCH_NM) {
        const candidateNm = lastInsideNm + stepNm
        const point = offsetLngLat(center.lng, center.lat, bearingDegrees, candidateNm)

        if (!isCoordinateInsideMapDisplayBounds(point.lng, point.lat)) {
            break
        }

        lastInsideNm = candidateNm
        stepNm *= 2
    }

    let low = lastInsideNm
    let high = Math.min(lastInsideNm + stepNm, MAX_EXTENT_SEARCH_NM)

    while (high - low > EXTENT_SEARCH_TOLERANCE_NM) {
        const mid = (low + high) / 2
        const point = offsetLngLat(center.lng, center.lat, bearingDegrees, mid)

        if (isCoordinateInsideMapDisplayBounds(point.lng, point.lat)) {
            low = mid
        } else {
            high = mid
        }
    }

    return low
}

function getMaxExtentNmAlongBearing(center, bearingDegrees) {
    return getFirstExitDistanceNm(center, bearingDegrees)
}

export function getMaxRadiusNmForCenter(center) {
    if (!center) {
        return 0
    }

    let maxRadiusNm = MAX_EXTENT_SEARCH_NM

    for (let bearing = 0; bearing < 360; bearing += 15) {
        maxRadiusNm = Math.min(maxRadiusNm, getFirstExitDistanceNm(center, bearing))
    }

    return maxRadiusNm
}

export function clampCircleRadiusToMapBounds(center, radiusNm) {
    if (!Number.isFinite(radiusNm) || radiusNm <= 0) {
        return 0
    }

    const maxRadius = getMaxRadiusNmForCenter(center)

    return Math.min(radiusNm, maxRadius)
}

export function clampAxisAlignedExtentsToMapBounds(center, halfWidthNm, halfHeightNm) {
    if (!center) {
        return {halfWidthNm: 0, halfHeightNm: 0}
    }

    const maxHalfWidthNm = Math.min(
        getMaxExtentNmAlongBearing(center, 90),
        getMaxExtentNmAlongBearing(center, 270),
    )
    const maxHalfHeightNm = Math.min(
        getMaxExtentNmAlongBearing(center, 0),
        getMaxExtentNmAlongBearing(center, 180),
    )

    return {
        halfWidthNm: Math.min(Math.max(halfWidthNm ?? 0, 0), maxHalfWidthNm),
        halfHeightNm: Math.min(Math.max(halfHeightNm ?? 0, 0), maxHalfHeightNm),
    }
}

function intersectWithVerticalEdge(pointA, pointB, lng) {
    const deltaLng = pointB.lng - pointA.lng

    if (Math.abs(deltaLng) < 1e-12) {
        return null
    }

    const t = (lng - pointA.lng) / deltaLng

    if (t < 0 || t > 1) {
        return null
    }

    return {
        lng,
        lat: pointA.lat + ((pointB.lat - pointA.lat) * t),
    }
}

function intersectWithHorizontalEdge(pointA, pointB, lat) {
    const deltaLat = pointB.lat - pointA.lat

    if (Math.abs(deltaLat) < 1e-12) {
        return null
    }

    const t = (lat - pointA.lat) / deltaLat

    if (t < 0 || t > 1) {
        return null
    }

    return {
        lng: pointA.lng + ((pointB.lng - pointA.lng) * t),
        lat,
    }
}

function clipPolygonByEdge(points, isInside, intersect) {
    if (!points.length) {
        return []
    }

    const output = []
    let previous = points[points.length - 1]

    for (const current of points) {
        const previousInside = isInside(previous)
        const currentInside = isInside(current)

        if (currentInside) {
            if (!previousInside) {
                const intersection = intersect(previous, current)

                if (intersection) {
                    output.push(intersection)
                }
            }

            output.push(current)
        } else if (previousInside) {
            const intersection = intersect(previous, current)

            if (intersection) {
                output.push(intersection)
            }
        }

        previous = current
    }

    return output
}

function clipPointsToMapDisplayBounds(points) {
    if (!points.length) {
        return []
    }

    const normalizedPoints = points.map((point) => ({
        lng: normalizeDisplayLongitude(point.lng),
        lat: point.lat,
    }))

    let clipped = normalizedPoints

    clipped = clipPolygonByEdge(
        clipped,
        (point) => point.lng >= MAP_DISPLAY_WEST_LONGITUDE,
        (pointA, pointB) => intersectWithVerticalEdge(pointA, pointB, MAP_DISPLAY_WEST_LONGITUDE),
    )
    clipped = clipPolygonByEdge(
        clipped,
        (point) => point.lng <= MAP_DISPLAY_EAST_LONGITUDE,
        (pointA, pointB) => intersectWithVerticalEdge(pointA, pointB, MAP_DISPLAY_EAST_LONGITUDE),
    )
    clipped = clipPolygonByEdge(
        clipped,
        (point) => point.lat >= MAP_DISPLAY_MIN_LATITUDE,
        (pointA, pointB) => intersectWithHorizontalEdge(pointA, pointB, MAP_DISPLAY_MIN_LATITUDE),
    )
    clipped = clipPolygonByEdge(
        clipped,
        (point) => point.lat <= MAP_DISPLAY_MAX_LATITUDE,
        (pointA, pointB) => intersectWithHorizontalEdge(pointA, pointB, MAP_DISPLAY_MAX_LATITUDE),
    )

    return clipped
}

function ringToPoints(ring) {
    if (!Array.isArray(ring) || ring.length === 0) {
        return []
    }

    const points = ring.map(([lng, lat]) => ({lng, lat}))
    const first = points[0]
    const last = points[points.length - 1]

    if (first.lng === last.lng && first.lat === last.lat) {
        points.pop()
    }

    return points
}

function pointsToRing(points, closeRing) {
    if (!points.length) {
        return []
    }

    const ring = points.map((point) => [
        normalizeDisplayLongitude(point.lng),
        clampDisplayLatitude(point.lat),
    ])

    if (closeRing && ring.length >= 3) {
        const [firstLng, firstLat] = ring[0]
        const [lastLng, lastLat] = ring[ring.length - 1]

        if (firstLng !== lastLng || firstLat !== lastLat) {
            ring.push([firstLng, firstLat])
        }
    }

    return ring
}

function clipLineCoordinatesToMapDisplayBounds(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
        return []
    }

    const clippedCoordinates = []

    for (let index = 0; index < coordinates.length - 1; index += 1) {
        const [startLng, startLat] = coordinates[index]
        const [endLng, endLat] = coordinates[index + 1]
        const clippedSegment = clipSegmentToMapDisplayBounds(
            {lng: startLng, lat: startLat},
            {lng: endLng, lat: endLat},
        )

        if (!clippedSegment) {
            continue
        }

        const [segmentStart, segmentEnd] = clippedSegment
        const lastCoordinate = clippedCoordinates[clippedCoordinates.length - 1]

        if (
            !lastCoordinate
            || lastCoordinate[0] !== segmentStart.lng
            || lastCoordinate[1] !== segmentStart.lat
        ) {
            clippedCoordinates.push([segmentStart.lng, segmentStart.lat])
        }

        clippedCoordinates.push([segmentEnd.lng, segmentEnd.lat])
    }

    return clippedCoordinates
}

function clipSegmentToMapDisplayBounds(pointA, pointB) {
    let t0 = 0
    let t1 = 1
    const dx = pointB.lng - pointA.lng
    const dy = pointB.lat - pointA.lat

    const clip = (parallel, perpendicular) => {
        if (parallel === 0) {
            return perpendicular >= 0
        }

        const intersection = perpendicular / parallel

        if (parallel < 0) {
            if (intersection > t1) {
                return false
            }

            if (intersection > t0) {
                t0 = intersection
            }
        } else {
            if (intersection < t0) {
                return false
            }

            if (intersection < t1) {
                t1 = intersection
            }
        }

        return true
    }

    if (!clip(-dx, pointA.lng - MAP_DISPLAY_WEST_LONGITUDE)) {
        return null
    }

    if (!clip(dx, MAP_DISPLAY_EAST_LONGITUDE - pointA.lng)) {
        return null
    }

    if (!clip(-dy, pointA.lat - MAP_DISPLAY_MIN_LATITUDE)) {
        return null
    }

    if (!clip(dy, MAP_DISPLAY_MAX_LATITUDE - pointA.lat)) {
        return null
    }

    return [
        {
            lng: normalizeDisplayLongitude(pointA.lng + (dx * t0)),
            lat: clampDisplayLatitude(pointA.lat + (dy * t0)),
        },
        {
            lng: normalizeDisplayLongitude(pointA.lng + (dx * t1)),
            lat: clampDisplayLatitude(pointA.lat + (dy * t1)),
        },
    ]
}

function clipPolygonRingToMapDisplayBounds(ring) {
    const clipped = clipPointsToMapDisplayBounds(ringToPoints(ring))

    if (clipped.length < 3) {
        return null
    }

    return pointsToRing(clipped, true)
}

export function clipGeometryToMapDisplayBounds(geometry) {
    if (!geometry) {
        return null
    }

    if (geometry.type === 'Polygon') {
        const clippedRings = geometry.coordinates
            .map((ring) => clipPolygonRingToMapDisplayBounds(ring))
            .filter(Boolean)

        if (!clippedRings.length) {
            return null
        }

        return {
            type: 'Polygon',
            coordinates: clippedRings,
        }
    }

    if (geometry.type === 'LineString') {
        const clippedCoordinates = clipLineCoordinatesToMapDisplayBounds(geometry.coordinates)

        if (clippedCoordinates.length < 2) {
            return null
        }

        return {
            type: 'LineString',
            coordinates: clippedCoordinates,
        }
    }

    if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates

        if (!isCoordinateInsideMapDisplayBounds(lng, lat)) {
            return null
        }

        return {
            type: 'Point',
            coordinates: [normalizeDisplayLongitude(lng), clampDisplayLatitude(lat)],
        }
    }

    return geometry
}
