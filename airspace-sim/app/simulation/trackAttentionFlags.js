import {TRACK_CORRELATION_MODES} from './trackFromDetection.js'
import {isCorrelationHoldActive} from './correlationHold.js'
import {shouldShowDropAttention} from './trackAutoDrop.js'
import {filterInhibitedSignalIds, sortSignalIdsByPriority} from './signalDefinitions.js'
import {
    getEmergencyAttentionFlagId,
    isEmergencyMode3Code,
    isIffMode3Stale,
} from './iffMode3.js'

/**
 * Derive attention flag IDs from current track state.
 *
 * @param {import('./types.js').TrackState} track
 * @param {number} [evaluationTime]
 * @param {number} [iffRefreshMs]
 * @returns {string[]}
 */
export function deriveAttentionFlagsFromTrackState(track, evaluationTime = Date.now(), iffRefreshMs = 1000) {
    const flags = []

    if (shouldShowDropAttention(track)) {
        flags.push('DROP')
    }

    if (track.iffMode3Code) {
        const emergencyFlagId = getEmergencyAttentionFlagId(track.iffMode3Code)

        if (emergencyFlagId) {
            flags.push(emergencyFlagId)
        }

        if (isIffMode3Stale(track, evaluationTime, iffRefreshMs)) {
            flags.push('IFF_STALE')
        }
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
 * @param {number} [iffRefreshMs]
 * @returns {string[]}
 */
export function resolveTrackAttentionFlags(track, evaluationTime = Date.now(), iffRefreshMs = 1000) {
    const assignedFlags = Array.isArray(track.attentionFlags) ? track.attentionFlags : []
    const derivedFlags = deriveAttentionFlagsFromTrackState(track, evaluationTime, iffRefreshMs)

    return sortSignalIdsByPriority([...assignedFlags, ...derivedFlags])
}

/**
 * @param {import('./types.js').TrackState} track
 * @param {number} [evaluationTime]
 * @param {Set<string>|string[]} [inhibitedAttentionIds]
 * @param {number} [iffRefreshMs]
 * @returns {string[]}
 */
export function getVisibleTrackAttentionFlags(
    track,
    evaluationTime = Date.now(),
    inhibitedAttentionIds = [],
    iffRefreshMs = 1000,
) {
    return filterInhibitedSignalIds(
        resolveTrackAttentionFlags(track, evaluationTime, iffRefreshMs),
        inhibitedAttentionIds,
    )
}

/**
 * @param {import('./types.js').TrackState[]} tracks
 * @param {number} [evaluationTime]
 * @param {number} [iffRefreshMs]
 * @returns {import('./types.js').TrackState[]}
 */
export function enrichTracksWithAttentionFlags(tracks, evaluationTime = Date.now(), iffRefreshMs = 1000) {
    return tracks.map((track) => ({
        ...track,
        attentionFlags: resolveTrackAttentionFlags(track, evaluationTime, iffRefreshMs),
    }))
}

export {isEmergencyMode3Code}
