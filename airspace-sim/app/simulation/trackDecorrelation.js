import {isCorrelationHoldActive} from './correlationHold.js'
import {TRACK_CORRELATION_MODES} from './trackFromDetection.js'

/**
 * @param {Object} [settings]
 * @returns {number}
 */
export function getTrackStaleThresholdMs(settings = {}) {
    return Math.max(
        (settings.radarRefreshMs ?? 4000) * 2,
        (settings.iffRefreshMs ?? 1000) * 4,
    )
}

/**
 * @returns {Object}
 */
export function getTrackDecorrelationUpdates() {
    return {
        correlated: false,
        iffMode3Code: null,
        iffMode3UpdatedAt: null,
    }
}

/**
 * @param {import('./types.js').TrackState} track
 * @param {number} timestamp
 * @param {number} staleThresholdMs
 * @returns {boolean}
 */
export function isTrackStale(track, timestamp, staleThresholdMs) {
    return timestamp - (track.lastSensorUpdateAt ?? timestamp) > staleThresholdMs
}

/**
 * @param {import('./types.js').TrackState} track
 * @param {number} timestamp
 * @returns {boolean}
 */
export function shouldDecorrelateTrack(track, timestamp) {
    return track.correlationMode === TRACK_CORRELATION_MODES.ACTIVE
        && track.correlated === true
        && !isCorrelationHoldActive(track, timestamp)
}

/**
 * @param {import('./TrackStore.js').TrackStore} trackStore
 * @param {number} timestamp
 * @param {import('./types.js').TrackState} [settings]
 * @returns {string[]} Track IDs decorrelated
 */
export function refreshTrackStaleAndDecorrelation(trackStore, timestamp, settings = {}) {
    const staleThresholdMs = getTrackStaleThresholdMs(settings)
    const decorrelatedTrackIds = []

    trackStore.getAllTracks().forEach((track) => {
        const trackId = track.trackId ?? track.id

        if (!trackId) {
            return
        }

        const stale = isTrackStale(track, timestamp, staleThresholdMs)
        const updates = {stale}

        if (stale && shouldDecorrelateTrack(track, timestamp)) {
            Object.assign(updates, getTrackDecorrelationUpdates())
            decorrelatedTrackIds.push(trackId)
        }

        if (updates.stale !== track.stale || updates.correlated === false) {
            trackStore.updateTrack(trackId, updates)
        }
    })

    return decorrelatedTrackIds
}

/**
 * Force decorrelation for active tracks when sensor processing stops.
 *
 * @param {import('./TrackStore.js').TrackStore} trackStore
 * @param {number} timestamp
 * @returns {string[]} Track IDs decorrelated
 */
export function decorrelateAllActiveTracks(trackStore, timestamp) {
    const decorrelatedTrackIds = []

    trackStore.getAllTracks().forEach((track) => {
        const trackId = track.trackId ?? track.id

        if (!trackId || !shouldDecorrelateTrack(track, timestamp)) {
            return
        }

        trackStore.updateTrack(trackId, getTrackDecorrelationUpdates())
        decorrelatedTrackIds.push(trackId)
    })

    return decorrelatedTrackIds
}
