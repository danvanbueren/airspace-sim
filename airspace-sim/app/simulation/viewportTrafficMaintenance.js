import {isPointInBounds} from './geo.js'
import {
    buildRoutePolyline,
    buildRouteSegmentLengths,
    createFlightAircraft,
    headingAlongRoute,
    positionAlongRoute,
} from './flightWorldUtils.js'
import {
    boundsOverlap,
    polylineIntersectsBounds,
} from './routeBoundsUtils.js'

const VIEWPORT_MAINTENANCE_RATIO = 0.9
const VIEWPORT_ROUTE_ATTEMPTS = 24
const VIEWPORT_PROGRESS_ATTEMPTS = 20

/**
 * @param {import('./types.js').CatalogRoute} route
 * @param {Map<string, {lng: number, lat: number}>} airportByIcao
 * @param {{west: number, south: number, east: number, north: number}} bounds
 * @returns {boolean}
 */
export function routeIntersectsBounds(route, airportByIcao, bounds) {
    return polylineIntersectsBounds(buildRoutePolyline(route, airportByIcao), bounds)
}

/**
 * @param {Array<import('./types.js').CatalogRoute>} routes
 * @param {Map<string, {lng: number, lat: number}>} airportByIcao
 * @param {{west: number, south: number, east: number, north: number}} bounds
 * @param {() => number} random
 * @returns {import('./types.js').CatalogRoute|null}
 */
export function pickRouteCrossingBounds(routes, airportByIcao, bounds, random) {
    const candidates = routes.filter((route) => (
        routeIntersectsBounds(route, airportByIcao, bounds)
    ))

    if (!candidates.length) {
        return null
    }

    const totalWeight = candidates.reduce((sum, route) => sum + (route.weight ?? 1), 0)
    let threshold = random() * totalWeight

    for (const route of candidates) {
        threshold -= route.weight ?? 1

        if (threshold <= 0) {
            return route
        }
    }

    return candidates[candidates.length - 1]
}

/**
 * @param {Array<{lng: number, lat: number}>} polyline
 * @param {number[]} segmentLengths
 * @param {number} totalRouteNm
 * @param {{west: number, south: number, east: number, north: number}} bounds
 * @param {() => number} random
 * @returns {number}
 */
export function pickProgressNmInsideBounds(polyline, segmentLengths, totalRouteNm, bounds, random) {
    if (!polyline.length || totalRouteNm <= 0 || !bounds) {
        return 0
    }

    for (let attempt = 0; attempt < VIEWPORT_PROGRESS_ATTEMPTS; attempt += 1) {
        const progressNm = random() * totalRouteNm
        const position = positionAlongRoute(polyline, segmentLengths, totalRouteNm, progressNm)

        if (position && isPointInBounds(position.lng, position.lat, bounds)) {
            return progressNm
        }
    }

    return Math.min(totalRouteNm * 0.05, totalRouteNm)
}

/**
 * Reassign out-of-view aircraft onto routes that cross the viewport when density sags.
 *
 * @param {import('./FlightWorldSimulator.js').FlightWorldSimulator} flightWorld
 * @param {() => number} random
 * @returns {Array<{id: string, longitude: number, latitude: number, heading: number, speed: number, altitude: number}>}
 */
export function maintainViewportTraffic(flightWorld, random) {
    const bounds = flightWorld.viewportBounds
    const targetInViewCount = flightWorld.viewportTargetInViewCount

    if (!bounds || !targetInViewCount) {
        return []
    }

    const inViewCount = flightWorld.getAircraftInBounds(bounds).length
    const maintenanceTarget = Math.ceil(targetInViewCount * VIEWPORT_MAINTENANCE_RATIO)

    if (inViewCount >= maintenanceTarget) {
        return []
    }

    const deficit = maintenanceTarget - inViewCount
    const outsideAircraft = flightWorld.getAllAircraft()
        .filter((aircraft) => (
            aircraft.trafficKind !== 'generalAviation'
            && !isPointInBounds(aircraft.longitude, aircraft.latitude, bounds)
        ))
        .slice(0, deficit)

    const reassignedAircraft = []

    outsideAircraft.forEach((aircraft) => {
        let route = null

        for (let attempt = 0; attempt < VIEWPORT_ROUTE_ATTEMPTS; attempt += 1) {
            const candidate = pickRouteCrossingBounds(
                flightWorld.routes,
                flightWorld.airportByIcao,
                bounds,
                random,
            ) ?? flightWorld.pickRoute(random)

            if (routeIntersectsBounds(candidate, flightWorld.airportByIcao, bounds)) {
                route = candidate
                break
            }
        }

        route = route ?? flightWorld.pickRoute(random)

        const next = createFlightAircraft(
            aircraft.id,
            route,
            flightWorld.airportByIcao,
            random,
        )
        const progressNm = pickProgressNmInsideBounds(
            next.polyline,
            next.segmentLengths,
            next.totalRouteNm,
            bounds,
            random,
        )
        const position = positionAlongRoute(
            next.polyline,
            next.segmentLengths,
            next.totalRouteNm,
            progressNm,
        )

        flightWorld.aircraft.set(aircraft.id, {
            ...aircraft,
            routeId: next.routeId,
            origin: next.origin,
            destination: next.destination,
            polyline: next.polyline,
            segmentLengths: next.segmentLengths,
            totalRouteNm: next.totalRouteNm,
            progressNm,
            longitude: position.lng,
            latitude: position.lat,
            heading: headingAlongRoute(
                next.polyline,
                next.segmentLengths,
                next.totalRouteNm,
                progressNm,
            ),
            speed: next.speed,
            baseSpeed: next.baseSpeed,
            cruiseAltitude: next.cruiseAltitude,
            altitude: next.altitude,
            fieldAltitude: next.fieldAltitude,
            speedBias: next.speedBias,
            kinematicPhase: 0,
            routeHeading: next.routeHeading ?? next.heading,
            profile: next.profile,
            nationality: next.nationality ?? aircraft.nationality,
            identity: next.identity,
            type: next.type,
            trafficKind: next.trafficKind,
            mode3Code: aircraft.mode3Code ?? next.mode3Code,
        })

        const updatedAircraft = flightWorld.aircraft.get(aircraft.id)

        reassignedAircraft.push({
            id: updatedAircraft.id,
            longitude: updatedAircraft.longitude,
            latitude: updatedAircraft.latitude,
            heading: updatedAircraft.heading,
            speed: updatedAircraft.speed,
            altitude: updatedAircraft.altitude,
        })
    })

    return reassignedAircraft
}
