import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    TRACK_TYPES,
    normalizeTrackDomain,
} from '../tools/milstd2525/trackSymbolCodes.js'
import {getDefaultSpecificTypeForTrackType} from '../tools/milstd2525/trackSpecificTypes.js'
import {isReferencePoint} from './trackKinds.js'
import {
    isValidMode3Code,
} from './iffMode3.js'

export const IFF_IDENTITY_PROMOTION_DELAY_MS = 5000
export const PENDING_IDENTITY_TIMEOUT_MS = 10000

export const USER_PROTECTED_CLASSIFICATION_FIELDS = [
    'domain',
    'identity',
    'type',
    'specificType',
]

function getIdentityPendingSinceAt(track) {
    return track.identityPendingSinceAt
        ?? track.lastSensorUpdateAt
        ?? track.lastExtrapolationAt
        ?? 0
}

function hasUserCommittedClassificationField(track, field) {
    return track.lastManagementEditFields?.includes(field) ?? false
}

export function hasValidIffForIdentityPromotion(track) {
    return isValidMode3Code(track.iffMode3Code)
        && getIffIdentityPromotionDelayAnchor(track) != null
}

export function getIffIdentityPromotionDelayAnchor(track) {
    return track.iffMode3FirstCorrelatedAt ?? track.iffMode3UpdatedAt ?? null
}

export function isGeneralAviationTrafficProfile(track) {
    return track.trafficKind === 'generalAviation'
        || track.profile === 'generalAviation'
}

export function getIdentityPromotionTypeForTrack(track) {
    if (normalizeTrackDomain(track.domain) !== TRACK_DOMAINS.AIR) {
        return null
    }

    if (isGeneralAviationTrafficProfile(track)) {
        return TRACK_TYPES.GENERAL_AVIATION
    }

    return TRACK_TYPES.CIVILIAN_AIR
}

export function getTrackIdentityPromotionUpdates(track, timestamp) {
    if (isReferencePoint(track)) {
        return null
    }

    if (track.identity !== TRACK_IDENTITIES.PENDING) {
        return null
    }

    if (
        hasValidIffForIdentityPromotion(track)
        && timestamp - getIffIdentityPromotionDelayAnchor(track) >= IFF_IDENTITY_PROMOTION_DELAY_MS
    ) {
        const updates = {}
        const promotionType = getIdentityPromotionTypeForTrack(track)

        if (!hasUserCommittedClassificationField(track, 'identity')) {
            updates.identity = TRACK_IDENTITIES.NEUTRAL
        }

        if (
            promotionType
            && !hasUserCommittedClassificationField(track, 'type')
            && !hasUserCommittedClassificationField(track, 'specificType')
        ) {
            updates.type = promotionType
            updates.specificType = getDefaultSpecificTypeForTrackType(promotionType)
        }

        return Object.keys(updates).length > 0 ? updates : null
    }

    if (
        !hasValidIffForIdentityPromotion(track)
        && timestamp - getIdentityPendingSinceAt(track) >= PENDING_IDENTITY_TIMEOUT_MS
        && !hasUserCommittedClassificationField(track, 'identity')
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
