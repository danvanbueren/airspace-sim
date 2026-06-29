import {formatMode3Code} from './iffMode3.js'
import {bearingDegrees, haversineDistanceNm} from './geo.js'
import {TRACK_CORRELATION_MODES} from './trackFromDetection.js'
import {isCorrelationHoldActive} from './correlationHold.js'

const LIVE_KINEMATIC_FIELDS = ['heading', 'speed', 'altitude']
const MIN_POSITION_DELTA_NM = 0.01

export function shouldSyncTrackKinematicsFromFlightWorld(track) {
    if (!track) {
        return false
    }

    if (track.correlationMode === TRACK_CORRELATION_MODES.SUSPEND) {
        return false
    }

    if (track.correlationMode !== TRACK_CORRELATION_MODES.ACTIVE
        && track.correlationMode !== TRACK_CORRELATION_MODES.EXTRAPOLATED) {
        return false
    }

    return Boolean(track.correlated || track.source === 'auto')
}

export function findCorrelatedAircraftForTrack(flightWorld, track, context = {}) {
    if (!flightWorld || !track) {
        return null
    }

    const longitude = context.longitude ?? track.longitude
    const latitude = context.latitude ?? track.latitude
    const mode3Code = formatMode3Code(context.mode3Code ?? track.iffMode3Code)

    if (mode3Code && typeof flightWorld.findAircraftByMode3Code === 'function') {
        const aircraftByCode = flightWorld.findAircraftByMode3Code(
            mode3Code,
            15,
            longitude,
            latitude,
        )

        if (aircraftByCode) {
            return aircraftByCode
        }
    }

    return flightWorld.findNearestAircraft?.(longitude, latitude) ?? null
}

export function buildKinematicUpdatesFromAircraft(track, nearestAircraft) {
    return {
        heading: Math.round(nearestAircraft.heading ?? 0),
        speed: Math.round(nearestAircraft.speed ?? 0),
        altitude: Math.round(nearestAircraft.altitude ?? 0),
        trafficKind: nearestAircraft.trafficKind ?? track.trafficKind,
        profile: nearestAircraft.profile ?? track.profile,
    }
}

function buildKinematicUpdatesFromPositionChange(track, longitude, latitude, timestamp = Date.now()) {
    const previousLongitude = track.longitude
    const previousLatitude = track.latitude

    if (!Number.isFinite(previousLongitude)
        || !Number.isFinite(previousLatitude)
        || !Number.isFinite(longitude)
        || !Number.isFinite(latitude)) {
        return null
    }

    const distanceNm = haversineDistanceNm(
        previousLatitude,
        previousLongitude,
        latitude,
        longitude,
    )

    if (distanceNm < MIN_POSITION_DELTA_NM) {
        return null
    }

    const heading = Math.round(bearingDegrees(
        previousLatitude,
        previousLongitude,
        latitude,
        longitude,
    ))
    const lastSampleAt = track.lastSensorUpdateAt ?? track.lastExtrapolationAt ?? timestamp
    const deltaSeconds = (timestamp - lastSampleAt) / 1000
    const updates = {heading}

    if (deltaSeconds > 0) {
        updates.speed = Math.round((distanceNm / deltaSeconds) * 3600)
    }

    return updates
}

export function buildCorrelatedTrackKinematicUpdates(
    flightWorld,
    track,
    context = {},
    timestamp = Date.now(),
) {
    const nearestAircraft = findCorrelatedAircraftForTrack(flightWorld, track, context)

    if (nearestAircraft) {
        return buildKinematicUpdatesFromAircraft(track, nearestAircraft)
    }

    if (context.longitude === undefined && context.latitude === undefined) {
        return null
    }

    return buildKinematicUpdatesFromPositionChange(
        track,
        context.longitude ?? track.longitude,
        context.latitude ?? track.latitude,
        timestamp,
    )
}

function hasKinematicUpdate(track, updates) {
    return LIVE_KINEMATIC_FIELDS.some((field) => (
        field in updates && track[field] !== updates[field]
    ))
}

export function applyCorrelatedTrackKinematicUpdates(
    flightWorld,
    trackStore,
    track,
    context = {},
    timestamp = Date.now(),
) {
    const trackId = track?.trackId ?? track?.id

    if (!trackId || !trackStore || !shouldSyncTrackKinematicsFromFlightWorld(track)) {
        return false
    }

    if (isCorrelationHoldActive(track, timestamp)) {
        return false
    }

    const updates = buildCorrelatedTrackKinematicUpdates(
        flightWorld,
        track,
        context,
        timestamp,
    )

    if (!updates || !hasKinematicUpdate(track, updates)) {
        return false
    }

    trackStore.updateTrack(trackId, updates)
    return true
}

export function syncActiveTrackKinematicsFromFlightWorld(flightWorld, trackStore, timestamp = Date.now()) {
    if (!flightWorld || !trackStore) {
        return
    }

    for (const track of trackStore.getAllTracks()) {
        applyCorrelatedTrackKinematicUpdates(
            flightWorld,
            trackStore,
            track,
            {},
            timestamp,
        )
    }
}
