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
    callsign,
    identity = TRACK_IDENTITIES.PENDING,
    infoFields = false,
}) {
    const resolvedCallsign = callsign ?? allocateNextReferencePointLabel(existingTracks)

    return {
        id: trackId,
        trackId,
        trackKind: TRACK_KINDS.REFERENCE_POINT,
        longitude,
        latitude,
        heading: 0,
        speed: 0,
        altitude: null,
        callsign: resolvedCallsign,
        domain: TRACK_DOMAINS.ACTIVITY,
        identity,
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
        infoFields: Boolean(infoFields),
        lastSensorUpdateAt: timestamp,
        lastExtrapolationAt: timestamp,
        lastUserEditAt: timestamp,
        stale: false,
    }
}

export function createTrackFromReferencePointManagementWindow(
    trackManagementWindow,
    timestamp = Date.now(),
) {
    return createReferencePointTrack({
        longitude: trackManagementWindow.lngLat.lng,
        latitude: trackManagementWindow.lngLat.lat,
        timestamp,
        trackId: trackManagementWindow.trackId,
        callsign: trackManagementWindow.callsign,
        identity: trackManagementWindow.identity,
        infoFields: trackManagementWindow.infoFields,
    })
}

export function createReferencePointUpdateFromManagementWindow(
    trackManagementWindow,
    existingTrack,
    timestamp = Date.now(),
) {
    const baseTrack = existingTrack ?? createTrackFromReferencePointManagementWindow(
        trackManagementWindow,
        timestamp,
    )

    return {
        ...baseTrack,
        longitude: trackManagementWindow.lngLat?.lng ?? baseTrack.longitude,
        latitude: trackManagementWindow.lngLat?.lat ?? baseTrack.latitude,
        callsign: trackManagementWindow.callsign || trackManagementWindow.trackId,
        identity: trackManagementWindow.identity ?? baseTrack.identity,
        infoFields: Boolean(trackManagementWindow.infoFields),
        userDirected: true,
        lastUserEditAt: timestamp,
        trackKind: TRACK_KINDS.REFERENCE_POINT,
        correlationMode: TRACK_CORRELATION_MODES.SUSPEND,
        dropProtect: true,
        speed: 0,
        heading: 0,
        altitude: null,
        type: REFERENCE_POINT_SYMBOL_CODE,
        symbolCode: REFERENCE_POINT_SYMBOL_CODE,
        useFamiliarIcon: false,
        iconSize: 32,
        stale: false,
    }
}
