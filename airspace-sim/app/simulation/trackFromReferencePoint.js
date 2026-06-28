import {getTrackCallsign} from '../tools/formatting/callsignValidation.js'
import {
    REFERENCE_POINT_SYMBOL_CODE,
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
} from '../tools/milstd2525/trackSymbolCodes.js'
import {TRACK_CORRELATION_MODES} from './trackFromDetection.js'
import {TRACK_KINDS} from './trackKinds.js'

const REFERENCE_POINT_LABEL_PATTERN = /^RP(\d+)$/i

export function formatReferencePointLabel(number) {
    return `RP${String(number).padStart(2, '0')}`
}

export function getUsedReferencePointNumbers(tracks, excludeTrackId) {
    const usedNumbers = new Set()

    tracks.forEach((track) => {
        if (track.trackKind !== TRACK_KINDS.REFERENCE_POINT) {
            return
        }

        const trackId = track.trackId ?? track.id

        if (!trackId || trackId === excludeTrackId) {
            return
        }

        const match = REFERENCE_POINT_LABEL_PATTERN.exec(getTrackCallsign(track))

        if (!match) {
            return
        }

        usedNumbers.add(Number(match[1]))
    })

    return usedNumbers
}

export function allocateNextReferencePointLabel(tracks, excludeTrackId) {
    const usedNumbers = getUsedReferencePointNumbers(tracks, excludeTrackId)
    let number = 1

    while (usedNumbers.has(number)) {
        number += 1
    }

    return formatReferencePointLabel(number)
}

export function createReferencePointTrack({
    longitude,
    latitude,
    existingTracks = [],
    timestamp = Date.now(),
    trackId = `RP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
}) {
    const callsign = allocateNextReferencePointLabel(existingTracks)

    return {
        id: trackId,
        trackId,
        trackKind: TRACK_KINDS.REFERENCE_POINT,
        longitude,
        latitude,
        heading: 0,
        speed: 0,
        altitude: null,
        callsign,
        domain: TRACK_DOMAINS.ACTIVITY,
        identity: TRACK_IDENTITIES.NEUTRAL,
        type: REFERENCE_POINT_SYMBOL_CODE,
        symbolCode: REFERENCE_POINT_SYMBOL_CODE,
        useFamiliarIcon: false,
        iconSize: 32,
        specificType: '',
        correlationMode: TRACK_CORRELATION_MODES.SUSPEND,
        source: 'manual',
        userDirected: true,
        dropProtect: true,
        correlated: false,
        infoFields: true,
        lastSensorUpdateAt: timestamp,
        lastExtrapolationAt: timestamp,
        lastUserEditAt: timestamp,
        stale: false,
    }
}
