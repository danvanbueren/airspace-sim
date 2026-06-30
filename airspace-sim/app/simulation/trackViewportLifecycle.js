import {isPointInBounds} from './geo.js'
import {isReferencePoint} from './trackKinds.js'

/**
 * @param {import('./types.js').TrackState} track
 * @param {{west: number, south: number, east: number, north: number}|null} displayBounds
 * @returns {boolean}
 */
export function isTrackInsideDisplayBounds(track, displayBounds) {
    if (!displayBounds || !track) {
        return true
    }

    const lng = track.longitude ?? track.coordinates?.[0]
    const lat = track.latitude ?? track.coordinates?.[1]

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        return true
    }

    return isPointInBounds(lng, lat, displayBounds)
}

/**
 * @param {import('./types.js').TrackState} track
 * @returns {boolean}
 */
export function isTrackEligibleForViewportDropping(track) {
    if (isReferencePoint(track)) {
        return false
    }

    if (track.dropProtect) {
        return false
    }

    if (track.source === 'manual') {
        return false
    }

    return true
}

/**
 * Remove auto firm tracks outside the display bounds when viewport dropping is enabled.
 *
 * @param {import('./TrackStore.js').TrackStore} trackStore
 * @param {{west: number, south: number, east: number, north: number}|null} displayBounds
 * @param {Object} [settings]
 * @returns {string[]} Track IDs removed
 */
export function processViewportOffDisplayTrackDropping(trackStore, displayBounds, settings = {}) {
    if (settings.viewportBasedTrackDroppingEnabled !== true || !displayBounds) {
        return []
    }

    const removedTrackIds = []

    for (const track of trackStore.getAllTracks()) {
        const trackId = track.trackId ?? track.id

        if (!trackId || !isTrackEligibleForViewportDropping(track)) {
            continue
        }

        if (isTrackInsideDisplayBounds(track, displayBounds)) {
            continue
        }

        trackStore.dropTrack(trackId)
        removedTrackIds.push(trackId)
    }

    return removedTrackIds
}
