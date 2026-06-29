import {offsetLngLat} from '../../simulation/geo.js'

export const GROUP_CRITERIA_RADIUS_NM = 3

export function buildCircleRingCoordinates(centerLng, centerLat, radiusNm = GROUP_CRITERIA_RADIUS_NM, segments = 72) {
    const ring = []

    for (let index = 0; index <= segments; index += 1) {
        const bearing = (index / segments) * 360
        const point = offsetLngLat(centerLng, centerLat, bearing, radiusNm)

        ring.push([point.lng, point.lat])
    }

    return ring
}
