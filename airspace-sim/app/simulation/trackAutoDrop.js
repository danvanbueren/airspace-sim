export const AUTO_DROP_RISK_DELAY_MS = 5000
export const AUTO_DROP_REMOVE_DELAY_MS = 10000

/**
 * @param {import('./types.js').TrackState} track
 * @returns {boolean}
 */
export function isTrackEligibleForAutoDrop(track) {
    return track.correlated !== true
        && !track.dropProtect
}

/**
 * @param {import('./types.js').TrackState} track
 * @returns {boolean}
 */
export function isTrackInAutoDropRiskPhase(track) {
    return Boolean(track.dropRiskAt) && !track.dropAt
}

/**
 * @param {import('./types.js').TrackState} track
 * @returns {boolean}
 */
export function isTrackInAutoDropPhase(track) {
    return Boolean(track.dropAt)
}

/**
 * @param {import('./types.js').TrackState} track
 * @returns {boolean}
 */
export function shouldShowDropAttention(track) {
    return isTrackEligibleForAutoDrop(track) && isTrackInAutoDropPhase(track)
}

/**
 * @param {import('./types.js').TrackState} track
 * @returns {Object}
 */
export function getAutoDropStateClearUpdates() {
    return {
        dropRiskAt: undefined,
        dropAt: undefined,
    }
}

/**
 * @param {import('./types.js').TrackState} track
 * @param {number} timestamp
 * @returns {Object|null}
 */
export function getAutoDropProgressUpdates(track, timestamp) {
    if (!isTrackEligibleForAutoDrop(track)) {
        if (track.dropRiskAt || track.dropAt) {
            return getAutoDropStateClearUpdates()
        }

        return null
    }

    if (!track.dropRiskAt) {
        return {
            dropRiskAt: timestamp,
        }
    }

    if (!track.dropAt && timestamp - track.dropRiskAt >= AUTO_DROP_RISK_DELAY_MS) {
        return {
            dropAt: timestamp,
        }
    }

    return null
}

/**
 * @param {import('./types.js').TrackState} track
 * @param {number} timestamp
 * @returns {boolean}
 */
export function shouldAutoDropTrack(track, timestamp) {
    return isTrackEligibleForAutoDrop(track)
        && isTrackInAutoDropPhase(track)
        && timestamp - track.dropAt >= AUTO_DROP_REMOVE_DELAY_MS
}

/**
 * @param {import('./TrackStore.js').TrackStore} trackStore
 * @param {number} timestamp
 * @returns {string[]} Track IDs removed by auto-drop
 */
export function processAutoDropTracks(trackStore, timestamp) {
    const removedTrackIds = []

    for (const track of trackStore.getAllTracks()) {
        const trackId = track.trackId ?? track.id

        if (!trackId) {
            continue
        }

        const updates = getAutoDropProgressUpdates(track, timestamp)

        if (updates) {
            trackStore.updateTrack(trackId, updates)
        }

        const currentTrack = trackStore.getTrack(trackId)

        if (!currentTrack) {
            continue
        }

        if (shouldAutoDropTrack(currentTrack, timestamp)) {
            trackStore.dropTrack(trackId)
            removedTrackIds.push(trackId)
        }
    }

    return removedTrackIds
}
