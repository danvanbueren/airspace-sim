import {TRACK_CORRELATION_MODES} from './trackFromDetection.js'
import {isCorrelationHoldActive} from './correlationHold.js'

const LIVE_KINEMATIC_FIELDS = ['heading', 'speed', 'altitude']

function shouldSyncTrackKinematicsFromFlightWorld(track) {
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

function getFlightWorldKinematicUpdates(track, nearestAircraft) {
    const lastEditedFields = new Set(track.lastManagementEditFields ?? [])
    const updates = {}

    if (!lastEditedFields.has('heading')) {
        updates.heading = Math.round(nearestAircraft.heading ?? 0)
    }

    if (!lastEditedFields.has('speed')) {
        updates.speed = Math.round(nearestAircraft.speed ?? 0)
    }

    if (!lastEditedFields.has('altitude')) {
        updates.altitude = Math.round(nearestAircraft.altitude ?? 0)
    }

    return updates
}

function hasKinematicUpdate(track, updates) {
    return LIVE_KINEMATIC_FIELDS.some((field) => (
        field in updates && track[field] !== updates[field]
    ))
}

export function syncActiveTrackKinematicsFromFlightWorld(flightWorld, trackStore) {
    if (!flightWorld || !trackStore) {
        return
    }

    for (const track of trackStore.getAllTracks()) {
        const trackId = track.trackId ?? track.id

        if (!trackId || !shouldSyncTrackKinematicsFromFlightWorld(track)) {
            continue
        }

        if (isCorrelationHoldActive(track)) {
            continue
        }

        const nearestAircraft = flightWorld.findNearestAircraft(track.longitude, track.latitude)

        if (!nearestAircraft) {
            continue
        }

        const updates = getFlightWorldKinematicUpdates(track, nearestAircraft)

        if (!hasKinematicUpdate(track, updates)) {
            continue
        }

        trackStore.updateTrack(trackId, updates)
    }
}
