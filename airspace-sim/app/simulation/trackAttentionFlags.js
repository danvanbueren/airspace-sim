import {TRACK_CORRELATION_MODES} from './trackFromDetection.js'
import {isCorrelationHoldActive} from './correlationHold.js'
import {isTrackInAutoDropPhase} from './trackAutoDrop.js'
import {filterInhibitedSignalIds, sortSignalIdsByPriority} from './signalDefinitions.js'

/**
 * Derive attention flag IDs from current track state.
 *
 * @param {import('./types.js').TrackState} track
 * @param {number} [evaluationTime]
 * @returns {string[]}
 */
export function deriveAttentionFlagsFromTrackState(track, evaluationTime = Date.now()) {
    const flags = []

    if (isTrackInAutoDropPhase(track)) {
        flags.push('DROP')
    }

    if (track.stale) {
        flags.push('STALE')
    }

    if (track.correlationMode === TRACK_CORRELATION_MODES.SUSPEND) {
        flags.push('SUSPENDED')
    }

    if (track.correlationMode === TRACK_CORRELATION_MODES.EXTRAPOLATED) {
        flags.push('EXTRAPOLATED')
    }

    if (isCorrelationHoldActive(track, evaluationTime)) {
        flags.push('HOLD')
    }

    return flags
}

/**
 * Merge operator-assigned flags with state-derived flags.
 *
 * @param {import('./types.js').TrackState} track
 * @param {number} [evaluationTime]
 * @returns {string[]}
 */
export function resolveTrackAttentionFlags(track, evaluationTime = Date.now()) {
    const assignedFlags = Array.isArray(track.attentionFlags) ? track.attentionFlags : []
    const derivedFlags = deriveAttentionFlagsFromTrackState(track, evaluationTime)

    return sortSignalIdsByPriority([...assignedFlags, ...derivedFlags])
}

/**
 * @param {import('./types.js').TrackState} track
 * @param {number} [evaluationTime]
 * @param {Set<string>|string[]} [inhibitedAttentionIds]
 * @returns {string[]}
 */
export function getVisibleTrackAttentionFlags(
    track,
    evaluationTime = Date.now(),
    inhibitedAttentionIds = [],
) {
    return filterInhibitedSignalIds(
        resolveTrackAttentionFlags(track, evaluationTime),
        inhibitedAttentionIds,
    )
}

/**
 * @param {import('./types.js').TrackState[]} tracks
 * @param {number} [evaluationTime]
 * @returns {import('./types.js').TrackState[]}
 */
export function enrichTracksWithAttentionFlags(tracks, evaluationTime = Date.now()) {
    return tracks.map((track) => ({
        ...track,
        attentionFlags: resolveTrackAttentionFlags(track, evaluationTime),
    }))
}
