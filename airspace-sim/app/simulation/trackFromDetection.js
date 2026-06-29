import {formatMode3Code} from './iffMode3.js'
import {TRACK_TYPES} from '../tools/milstd2525/trackSymbolCodes.js'
import {resolveAutoTrackNationalityFromAircraft} from '../tools/milstd2525/airportIcaoNationality.js'

export const TRACK_CORRELATION_MODES = {
    ACTIVE: 'active',
    EXTRAPOLATED: 'extrapolated',
    SUSPEND: 'suspend',
}

export function trackFromInitiation({plotId, sensorType, longitude, latitude, timestamp, flightWorld, mode3Code}) {
    const normalizedMode3Code = mode3Code ? formatMode3Code(mode3Code) : null
    const nearest = normalizedMode3Code
        ? (
            flightWorld?.findAircraftByMode3Code?.(normalizedMode3Code, 15, longitude, latitude)
            ?? flightWorld?.findNearestAircraft?.(longitude, latitude)
        )
        : flightWorld?.findNearestAircraft?.(longitude, latitude)
    const id = `TRK-${sensorType}-${plotId}`

    return {
        id,
        trackId: id,
        longitude,
        latitude,
        heading: nearest?.heading ?? 0,
        speed: nearest?.speed ?? 400,
        altitude: nearest?.altitude ?? 30000,
        lastSensorUpdateAt: timestamp,
        lastExtrapolationAt: timestamp,
        stale: false,
        domain: nearest?.domain ?? 'air',
        identity: 'pending',
        type: TRACK_TYPES.AIR_UNSPECIFIED,
        specificType: '',
        nationality: resolveAutoTrackNationalityFromAircraft(nearest),
        callsign: nearest?.id ?? id,
        source: 'auto',
        initiatedBy: sensorType,
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        correlated: false,
        userDirected: false,
        identityPendingSinceAt: timestamp,
        plotId,
        ...(normalizedMode3Code ? {
            iffMode3Code: normalizedMode3Code,
            iffMode3UpdatedAt: timestamp,
            iffMode3FirstCorrelatedAt: timestamp,
        } : {}),
    }
}

export function trackFromManualInput(track) {
    const id = track.trackId ?? track.id

    return {
        ...track,
        id,
        trackId: id,
        correlationMode: track.correlationMode ?? TRACK_CORRELATION_MODES.ACTIVE,
        source: track.source ?? 'manual',
        lastExtrapolationAt: track.lastExtrapolationAt ?? Date.now(),
        lastSensorUpdateAt: track.lastSensorUpdateAt ?? Date.now(),
        identityPendingSinceAt: track.identityPendingSinceAt ?? Date.now(),
        stale: false,
    }
}
