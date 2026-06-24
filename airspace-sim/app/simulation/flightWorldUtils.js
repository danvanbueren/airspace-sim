import airportsData from '@/app/data/airports.json'
import airRoutesData from '@/app/data/airRoutes.json'
import {haversineDistanceNm} from './geo'
import {assignMode3Code} from './iffMode3'
import {TRACK_DOMAINS, TRACK_IDENTITIES, TRACK_TYPES} from '@/app/tools/milstd2525/trackSymbolCodes'

const CIVILIAN_PROFILES = ['civilian', 'commercial']
const MILITARY_PROFILES = ['fighter', 'tanker', 'transport']

export function loadAirportCatalog() {
    return airportsData
}

export function loadAirRouteCatalog() {
    return airRoutesData
}

export function buildAirportIndex(airports) {
    const byIcao = new Map()

    airports.forEach((airport) => {
        byIcao.set(airport.icao, airport)
    })

    return byIcao
}

export function buildWeightedRoutePicker(routes, airportByIcao) {
    const validRoutes = routes.filter((route) => (
        airportByIcao.has(route.origin) && airportByIcao.has(route.destination)
    ))

    const totalWeight = validRoutes.reduce((sum, route) => sum + (route.weight ?? 1), 0)

    return (random) => {
        let threshold = random() * totalWeight

        for (const route of validRoutes) {
            threshold -= route.weight ?? 1

            if (threshold <= 0) {
                return route
            }
        }

        return validRoutes[validRoutes.length - 1]
    }
}

export function buildRoutePolyline(route, airportByIcao) {
    const origin = airportByIcao.get(route.origin)
    const destination = airportByIcao.get(route.destination)

    if (!origin || !destination) {
        return []
    }

    const points = [
        {lng: origin.lng, lat: origin.lat},
    ]

    if (Array.isArray(route.waypoints)) {
        route.waypoints.forEach((icao) => {
            const waypoint = airportByIcao.get(icao)

            if (waypoint) {
                points.push({lng: waypoint.lng, lat: waypoint.lat})
            }
        })
    }

    points.push({lng: destination.lng, lat: destination.lat})

    return points
}

export function buildRouteSegmentLengths(points) {
    const segmentLengths = []
    let totalNm = 0

    for (let index = 0; index < points.length - 1; index += 1) {
        const start = points[index]
        const end = points[index + 1]
        const lengthNm = haversineDistanceNm(start.lat, start.lng, end.lat, end.lng)

        segmentLengths.push(lengthNm)
        totalNm += lengthNm
    }

    return {segmentLengths, totalNm}
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180)
}

function toDegrees(radians) {
    return radians * (180 / Math.PI)
}

function interpolateGreatCircle(start, end, fraction) {
    const lat1 = toRadians(start.lat)
    const lng1 = toRadians(start.lng)
    const lat2 = toRadians(end.lat)
    const lng2 = toRadians(end.lng)

    const delta = Math.acos(
        Math.min(1, Math.max(-1,
            Math.sin(lat1) * Math.sin(lat2)
            + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1),
        )),
    )

    if (delta < 1e-9) {
        return {lng: start.lng, lat: start.lat}
    }

    const a = Math.sin((1 - fraction) * delta) / Math.sin(delta)
    const b = Math.sin(fraction * delta) / Math.sin(delta)
    const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2)
    const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2)
    const z = a * Math.sin(lat1) + b * Math.sin(lat2)

    return {
        lng: toDegrees(Math.atan2(y, x)),
        lat: toDegrees(Math.atan2(z, Math.sqrt(x * x + y * y))),
    }
}

export function positionAlongRoute(points, segmentLengths, totalNm, progressNm) {
    if (!points.length) {
        return null
    }

    if (points.length === 1 || totalNm <= 0) {
        return {...points[0]}
    }

    let remaining = Math.max(0, Math.min(totalNm, progressNm))

    for (let index = 0; index < segmentLengths.length; index += 1) {
        const segmentLength = segmentLengths[index]

        if (remaining <= segmentLength || index === segmentLengths.length - 1) {
            const fraction = segmentLength > 0 ? remaining / segmentLength : 0

            return interpolateGreatCircle(points[index], points[index + 1], fraction)
        }

        remaining -= segmentLength
    }

    return {...points[points.length - 1]}
}

export function headingAlongRoute(points, segmentLengths, totalNm, progressNm) {
    if (points.length < 2 || totalNm <= 0) {
        return 0
    }

    let remaining = Math.max(0, Math.min(totalNm, progressNm))

    for (let index = 0; index < segmentLengths.length; index += 1) {
        const segmentLength = segmentLengths[index]

        if (remaining <= segmentLength || index === segmentLengths.length - 1) {
            const start = points[index]
            const end = points[index + 1]
            const lat1 = toRadians(start.lat)
            const lat2 = toRadians(end.lat)
            const dLng = toRadians(end.lng - start.lng)
            const y = Math.sin(dLng) * Math.cos(lat2)
            const x = Math.cos(lat1) * Math.sin(lat2)
                - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
            const bearing = (toDegrees(Math.atan2(y, x)) + 360) % 360

            return bearing
        }

        remaining -= segmentLength
    }

    return 0
}

export function createFlightAircraft(id, route, airportByIcao, random) {
    const polyline = buildRoutePolyline(route, airportByIcao)
    const {segmentLengths, totalNm} = buildRouteSegmentLengths(polyline)
    const isMilitary = random() < 0.2
    const profilePool = isMilitary ? MILITARY_PROFILES : CIVILIAN_PROFILES
    const progressNm = random() * Math.max(totalNm, 1)
    const position = positionAlongRoute(polyline, segmentLengths, totalNm, progressNm)
    const heading = headingAlongRoute(polyline, segmentLengths, totalNm, progressNm)
    const cruiseSpeed = isMilitary
        ? 320 + Math.floor(random() * 280)
        : 380 + Math.floor(random() * 120)
    const cruiseAltitude = isMilitary
        ? 15_000 + Math.floor(random() * 20_000)
        : 28_000 + Math.floor(random() * 12_000)
    const mode3Code = assignMode3Code(random)

    return {
        id,
        trafficKind: 'commercial',
        routeId: route.id,
        origin: route.origin,
        destination: route.destination,
        polyline,
        segmentLengths,
        totalRouteNm: totalNm,
        progressNm,
        longitude: position.lng,
        latitude: position.lat,
        heading,
        speed: cruiseSpeed,
        baseSpeed: cruiseSpeed,
        cruiseAltitude,
        altitude: cruiseAltitude,
        fieldAltitude: 1500,
        speedBias: Math.round((random() - 0.5) * 10),
        kinematicPhase: 0,
        routeHeading: heading,
        profile: profilePool[Math.floor(random() * profilePool.length)],
        domain: TRACK_DOMAINS.AIR,
        identity: isMilitary ? TRACK_IDENTITIES.UNKNOWN : TRACK_IDENTITIES.NEUTRAL,
        type: TRACK_TYPES.FIGHTER,
        mode3Code,
    }
}

export function assignNewRoute(aircraft, pickRoute, airportByIcao, random) {
    const route = pickRoute(random)
    const next = createFlightAircraft(aircraft.id, route, airportByIcao, random)

    return {
        ...aircraft,
        routeId: next.routeId,
        origin: next.origin,
        destination: next.destination,
        polyline: next.polyline,
        segmentLengths: next.segmentLengths,
        totalRouteNm: next.totalRouteNm,
        progressNm: 0,
        longitude: next.longitude,
        latitude: next.latitude,
        heading: next.heading,
        speed: next.speed,
        baseSpeed: next.baseSpeed,
        cruiseAltitude: next.cruiseAltitude,
        altitude: next.altitude,
        fieldAltitude: next.fieldAltitude,
        speedBias: next.speedBias,
        kinematicPhase: 0,
        routeHeading: next.routeHeading ?? next.heading,
        profile: next.profile,
        identity: next.identity,
        mode3Code: aircraft.mode3Code ?? next.mode3Code,
    }
}

export function createBootstrapRandom(seed) {
    return createSeededRandom('flight-world-bootstrap', seed)
}
