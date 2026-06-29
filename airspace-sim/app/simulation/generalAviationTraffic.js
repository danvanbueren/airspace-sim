import {offsetLngLat} from './geo.js'
import {assignMode3Code} from './iffMode3.js'
import {TRACK_DOMAINS, TRACK_IDENTITIES, TRACK_TYPES} from '../tools/milstd2525/trackSymbolCodes.js'

const GA_MIN_ORBIT_RADIUS_NM = 4
const GA_MAX_ORBIT_RADIUS_NM = 14
const GA_MIN_ALTITUDE_FT = 1200
const GA_MAX_ALTITUDE_FT = 3500
const GA_MIN_SPEED_KTS = 80
const GA_MAX_SPEED_KTS = 120
const GA_FLEET_FRACTION = 0.04
const GA_FLEET_MAX = 40

/**
 * @param {Array<{icao: string, lng: number, lat: number, class?: string}>} airports
 * @returns {Array<{icao: string, lng: number, lat: number, class?: string}>}
 */
export function getGeneralAviationAirports(airports) {
    return airports.filter((airport) => (
        Number.isFinite(airport.lng)
        && Number.isFinite(airport.lat)
        && airport.class !== 'strip'
        && airport.class !== 'military'
    ))
}

/**
 * @param {number} maxActiveFlights
 * @returns {number}
 */
export function getGeneralAviationFleetSize(maxActiveFlights) {
    return Math.min(GA_FLEET_MAX, Math.floor(maxActiveFlights * GA_FLEET_FRACTION))
}

/**
 * @param {string} id
 * @param {{icao: string, lng: number, lat: number}} airport
 * @param {() => number} random
 * @returns {import('./types.js').TruthAircraftState}
 */
export function createGeneralAviationAircraft(id, airport, random) {
    const orbitRadiusNm = GA_MIN_ORBIT_RADIUS_NM
        + (random() * (GA_MAX_ORBIT_RADIUS_NM - GA_MIN_ORBIT_RADIUS_NM))
    const orbitAngle = random() * 360
    const orbitDirection = random() < 0.5 ? -1 : 1
    const position = offsetLngLat(airport.lng, airport.lat, orbitAngle, orbitRadiusNm)
    const heading = (orbitAngle + (orbitDirection > 0 ? 90 : 270) + 360) % 360
    const useEuropeanVfr = !airport.icao.startsWith('K')

    return {
        id,
        trafficKind: 'generalAviation',
        homeAirportIcao: airport.icao,
        orbitCenterLng: airport.lng,
        orbitCenterLat: airport.lat,
        orbitRadiusNm,
        orbitAngle,
        orbitDirection,
        longitude: position.lng,
        latitude: position.lat,
        heading,
        speed: GA_MIN_SPEED_KTS + Math.floor(random() * (GA_MAX_SPEED_KTS - GA_MIN_SPEED_KTS)),
        altitude: GA_MIN_ALTITUDE_FT + Math.floor(random() * (GA_MAX_ALTITUDE_FT - GA_MIN_ALTITUDE_FT)),
        mode3Code: assignMode3Code(random, {
            vfr: true,
            useEuropeanVfr,
        }),
        profile: 'generalAviation',
        domain: TRACK_DOMAINS.AIR,
        identity: TRACK_IDENTITIES.NEUTRAL,
        type: TRACK_TYPES.AIR_UNSPECIFIED,
    }
}

/**
 * @param {import('./types.js').TruthAircraftState} aircraft
 * @param {number} deltaSeconds
 * @returns {import('./types.js').TruthAircraftState}
 */
export function advanceGeneralAviationAircraft(aircraft, deltaSeconds) {
    const orbitRadiusNm = aircraft.orbitRadiusNm ?? GA_MIN_ORBIT_RADIUS_NM
    const speed = aircraft.speed ?? GA_MIN_SPEED_KTS
    const orbitDirection = aircraft.orbitDirection ?? 1
    const circumferenceNm = 2 * Math.PI * orbitRadiusNm
    const deltaNm = (speed * deltaSeconds) / 3600
    const deltaAngle = (deltaNm / circumferenceNm) * 360 * orbitDirection
    const orbitAngle = ((aircraft.orbitAngle ?? 0) + deltaAngle + 360) % 360
    const position = offsetLngLat(
        aircraft.orbitCenterLng,
        aircraft.orbitCenterLat,
        orbitAngle,
        orbitRadiusNm,
    )
    const heading = (orbitAngle + (orbitDirection > 0 ? 90 : 270) + 360) % 360

    return {
        ...aircraft,
        orbitAngle,
        longitude: position.lng,
        latitude: position.lat,
        heading: Math.round(heading),
    }
}

/**
 * @param {Array<{icao: string, lng: number, lat: number}>} airports
 * @param {() => number} random
 * @returns {{icao: string, lng: number, lat: number}|null}
 */
export function pickGeneralAviationAirport(airports, random) {
    if (!airports.length) {
        return null
    }

    return airports[Math.floor(random() * airports.length)]
}
