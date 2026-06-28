import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    TRACK_TYPES,
    normalizeTrackDomain,
} from '../tools/milstd2525/trackSymbolCodes.js'
import {getDefaultSpecificTypeForTrackType} from '../tools/milstd2525/trackSpecificTypes.js'
import {
    isSharedVfrMode3Code,
    isValidMode3Code,
} from './iffMode3.js'

export const IFF_IDENTITY_PROMOTION_DELAY_MS = 2000
export const PENDING_IDENTITY_TIMEOUT_MS = 10000

function getIdentityPendingSinceAt(track) {
    return track.identityPendingSinceAt
        ?? track.lastSensorUpdateAt
        ?? track.lastExtrapolationAt
        ?? 0
}

function hasUserCommittedIdentity(track) {
    return track.lastManagementEditFields?.includes('identity') ?? false
}

export function hasValidIffForIdentityPromotion(track) {
    return isValidMode3Code(track.iffMode3Code)
        && !isSharedVfrMode3Code(track.iffMode3Code)
        && track.iffMode3UpdatedAt != null
}

export function getTrackIdentityPromotionUpdates(track, timestamp) {
    if (track.identity !== TRACK_IDENTITIES.PENDING || hasUserCommittedIdentity(track)) {
        return null
    }

    if (
        hasValidIffForIdentityPromotion(track)
        && timestamp - track.iffMode3UpdatedAt >= IFF_IDENTITY_PROMOTION_DELAY_MS
    ) {
        const updates = {
            identity: TRACK_IDENTITIES.NEUTRAL,
        }

        if (normalizeTrackDomain(track.domain) === TRACK_DOMAINS.AIR) {
            updates.type = TRACK_TYPES.CIVILIAN_AIR
            updates.specificType = getDefaultSpecificTypeForTrackType(TRACK_TYPES.CIVILIAN_AIR)
        }

        return updates
    }

    if (
        !hasValidIffForIdentityPromotion(track)
        && timestamp - getIdentityPendingSinceAt(track) >= PENDING_IDENTITY_TIMEOUT_MS
    ) {
        return {
            identity: TRACK_IDENTITIES.UNKNOWN,
        }
    }

    return null
}

export function processTrackIdentityPromotion(trackStore, timestamp) {
    for (const track of trackStore.getAllTracks()) {
        const trackId = track.trackId ?? track.id

        if (!trackId) {
            continue
        }

        const updates = getTrackIdentityPromotionUpdates(track, timestamp)

        if (updates) {
            trackStore.updateTrack(trackId, updates)
        }
    }
}
