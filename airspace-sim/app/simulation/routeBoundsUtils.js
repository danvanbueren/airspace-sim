import {isPointInBounds} from './geo.js'

/**
 * @param {Array<{lng: number, lat: number}>} polyline
 * @returns {{west: number, south: number, east: number, north: number}|null}
 */
export function boundingBoxOfPolyline(polyline) {
    if (!polyline?.length) {
        return null
    }

    let west = Infinity
    let east = -Infinity
    let south = Infinity
    let north = -Infinity

    polyline.forEach((point) => {
        west = Math.min(west, point.lng)
        east = Math.max(east, point.lng)
        south = Math.min(south, point.lat)
        north = Math.max(north, point.lat)
    })

    return {west, south, east, north}
}

/**
 * @param {{west: number, south: number, east: number, north: number}} left
 * @param {{west: number, south: number, east: number, north: number}} right
 * @returns {boolean}
 */
export function boundsOverlap(left, right) {
    if (!left || !right) {
        return false
    }

    return left.west <= right.east
        && left.east >= right.west
        && left.south <= right.north
        && left.north >= right.south
}

/**
 * @param {Array<{lng: number, lat: number}>} polyline
 * @param {{west: number, south: number, east: number, north: number}} bounds
 * @returns {boolean}
 */
export function polylineIntersectsBounds(polyline, bounds) {
    if (!polyline?.length || !bounds) {
        return false
    }

    if (polyline.some((point) => isPointInBounds(point.lng, point.lat, bounds))) {
        return true
    }

    return boundsOverlap(boundingBoxOfPolyline(polyline), bounds)
}
