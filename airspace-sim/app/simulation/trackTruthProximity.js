import {haversineDistanceNm} from './geo.js'
import {formatMode3Code} from './iffMode3.js'

const DEFAULT_CORRELATION_THRESHOLD_NM = 5

/**
 * @param {import('./FlightWorldSimulator.js').FlightWorldSimulator|null|undefined} flightWorld
 * @param {string|null|undefined} aircraftId
 * @returns {import('./types.js').TruthAircraftState|null}
 */
export function getTruthAircraftById(flightWorld, aircraftId) {
    if (!flightWorld || !aircraftId) {
        return null
    }

    if (typeof flightWorld.getAircraftById === 'function') {
        return flightWorld.getAircraftById(aircraftId) ?? null
    }

    return flightWorld.getAllAircraft?.().find((aircraft) => aircraft.id === aircraftId) ?? null
}

/**
 * @param {import('./types.js').TrackState} track
 * @param {import('./types.js').TruthAircraftState} aircraft
 * @param {number} [correlationThresholdNm]
 * @returns {number}
 */
export function getTrackTruthAircraftDistanceNm(track, aircraft, correlationThresholdNm = DEFAULT_CORRELATION_THRESHOLD_NM) {
    if (!track || !aircraft) {
        return Infinity
    }

    return haversineDistanceNm(
        track.latitude,
        track.longitude,
        aircraft.latitude,
        aircraft.longitude,
    )
}

/**
 * Resolve the truth aircraft that originated or sustains a firm track.
 *
 * @param {import('./FlightWorldSimulator.js').FlightWorldSimulator|null|undefined} flightWorld
 * @param {import('./types.js').TrackState} track
 * @param {number} [correlationThresholdNm]
 * @returns {import('./types.js').TruthAircraftState|null}
 */
export function findTruthAircraftForTrack(flightWorld, track, correlationThresholdNm = DEFAULT_CORRELATION_THRESHOLD_NM) {
    if (!flightWorld || !track) {
        return null
    }

    const byId = getTruthAircraftById(flightWorld, track.truthAircraftId)

    if (byId) {
        return byId
    }

    const mode3Code = formatMode3Code(track.iffMode3Code)

    if (mode3Code && typeof flightWorld.findAircraftByMode3Code === 'function') {
        const aircraftByCode = flightWorld.findAircraftByMode3Code(
            mode3Code,
            correlationThresholdNm,
            track.longitude,
            track.latitude,
        )

        if (aircraftByCode) {
            return aircraftByCode
        }
    }

    return flightWorld.findNearestAircraft?.(
        track.longitude,
        track.latitude,
        correlationThresholdNm,
    ) ?? null
}

/**
 * @param {import('./FlightWorldSimulator.js').FlightWorldSimulator|null|undefined} flightWorld
 * @param {import('./types.js').TrackState} track
 * @param {Object} [settings]
 * @returns {boolean}
 */
export function isTruthAircraftNearTrack(flightWorld, track, settings = {}) {
    const correlationThresholdNm = settings.correlationThresholdNm ?? DEFAULT_CORRELATION_THRESHOLD_NM
    const truthAircraft = findTruthAircraftForTrack(flightWorld, track, correlationThresholdNm)

    if (!truthAircraft) {
        return false
    }

    return getTrackTruthAircraftDistanceNm(track, truthAircraft, correlationThresholdNm)
        <= correlationThresholdNm
}

/**
 * @param {Object} [settings]
 * @returns {number}
 */
export function getCorrelationThresholdNm(settings = {}) {
    return settings.correlationThresholdNm ?? DEFAULT_CORRELATION_THRESHOLD_NM
}
