import {formatMode3Code} from './iffMode3.js'

export const TRACK_CORRELATION_MODES = {
    ACTIVE: 'active',
    EXTRAPOLATED: 'extrapolated',
    SUSPEND: 'suspend',
}

export function trackFromInitiation({plotId, sensorType, longitude, latitude, timestamp, flightWorld, mode3Code}) {
    const nearest = flightWorld?.findNearestAircraft?.(longitude, latitude)
    const id = `TRK-${sensorType}-${plotId}`
    const normalizedMode3Code = mode3Code ? formatMode3Code(mode3Code) : null

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
        identity: nearest?.identity ?? 'pending',
        type: nearest?.type ?? '01:110104',
        callsign: nearest?.id ?? id,
        source: 'auto',
        initiatedBy: sensorType,
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        correlated: false,
        userDirected: false,
        plotId,
        ...(normalizedMode3Code ? {
            iffMode3Code: normalizedMode3Code,
            iffMode3UpdatedAt: timestamp,
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
        stale: false,
    }
}
