import {
    normalizeHeading,
    parseTrackKinematicFields,
    parseWholeNumberInput,
} from '../formatting/trackFieldFormatting.js'
import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    getDefaultTrackTypeForDomain,
} from '../milstd2525/trackSymbolCodes.js'
import {getDefaultSpecificTypeForTrackType} from '../milstd2525/trackSpecificTypes.js'

const KINEMATIC_FIELDS = new Set(['heading', 'speed', 'altitude'])

export const TRACK_MANAGEMENT_WINDOW_LIVE_FIELDS = [
    'lngLat',
    'domain',
    'identity',
    'type',
    'specificType',
    'callsign',
    'heading',
    'speed',
    'altitude',
    'infoFields',
    'correlationMode',
]

function getChangedFieldSet(changedFields) {
    if (!changedFields) {
        return null
    }

    if (changedFields instanceof Set) {
        return changedFields
    }

    return new Set(changedFields)
}

function shouldUseWindowKinematicField(field, changedFieldSet, existingTrack) {
    return !existingTrack || !changedFieldSet || changedFieldSet.has(field)
}

function parseKinematicFields(trackManagementWindow) {
    const parsedHeading = parseWholeNumberInput(trackManagementWindow.heading)
    const parsedSpeed = parseWholeNumberInput(trackManagementWindow.speed)
    const parsedAltitude = parseWholeNumberInput(trackManagementWindow.altitude)

    return {
        heading: normalizeHeading(parsedHeading),
        speed: parsedSpeed === '' ? null : parsedSpeed,
        altitude: parsedAltitude === '' ? null : parsedAltitude,
    }
}

function getTrackKinematicFields(trackManagementWindow, existingTrack, changedFields) {
    const changedFieldSet = getChangedFieldSet(changedFields)
    const parsedFields = parseKinematicFields(trackManagementWindow)

    if (!existingTrack || !changedFieldSet) {
        return parsedFields
    }

    return Object.fromEntries(Array.from(KINEMATIC_FIELDS, (field) => [
        field,
        shouldUseWindowKinematicField(field, changedFieldSet, existingTrack)
            ? parsedFields[field]
            : existingTrack[field],
    ]))
}

export function getTrackManagementWindowLiveUpdatesFromTrack(track) {
    const trackId = track.trackId ?? track.id
    const domain = track.domain ?? TRACK_DOMAINS.AIR
    const type = track.type ?? getDefaultTrackTypeForDomain(domain)
    const kinematicFields = parseTrackKinematicFields(track)

    return {
        lngLat: {
            lng: track.longitude,
            lat: track.latitude,
        },
        domain,
        identity: track.identity ?? TRACK_IDENTITIES.PENDING,
        type,
        specificType: track.specificType ?? getDefaultSpecificTypeForTrackType(type),
        callsign: track.callsign ?? trackId,
        heading: kinematicFields.heading,
        speed: kinematicFields.speed,
        altitude: kinematicFields.altitude,
        infoFields: Boolean(track.infoFields),
        correlationMode: track.correlationMode ?? 'active',
    }
}

export function mergeTrackManagementWindowLiveUpdates(
    trackManagementWindow,
    liveUpdates,
    skipFields = new Set(),
) {
    const skippedFields = skipFields instanceof Set ? skipFields : new Set(skipFields)
    const mergedWindow = {...trackManagementWindow}

    for (const field of TRACK_MANAGEMENT_WINDOW_LIVE_FIELDS) {
        if (skippedFields.has(field)) {
            continue
        }

        mergedWindow[field] = liveUpdates[field]
    }

    return mergedWindow
}

export function syncTrackManagementWindowsFromTracks(
    trackManagementWindows,
    tracks,
    skipFieldsByWindowId = {},
) {
    if (trackManagementWindows.length === 0 || tracks.length === 0) {
        return trackManagementWindows
    }

    const tracksById = new Map()

    for (const track of tracks) {
        const trackId = track.trackId ?? track.id

        if (trackId) {
            tracksById.set(trackId, track)
        }
    }

    let hasChanges = false

    const nextWindows = trackManagementWindows.map((trackManagementWindow) => {
        const liveTrack = tracksById.get(trackManagementWindow.trackId)

        if (!liveTrack) {
            return trackManagementWindow
        }

        const liveUpdates = getTrackManagementWindowLiveUpdatesFromTrack(liveTrack)
        const skipFields = skipFieldsByWindowId[trackManagementWindow.id] ?? new Set()
        const mergedWindow = mergeTrackManagementWindowLiveUpdates(
            trackManagementWindow,
            liveUpdates,
            skipFields,
        )

        const changed = TRACK_MANAGEMENT_WINDOW_LIVE_FIELDS.some((field) => {
            if (field === 'lngLat') {
                return mergedWindow.lngLat.lng !== trackManagementWindow.lngLat.lng
                    || mergedWindow.lngLat.lat !== trackManagementWindow.lngLat.lat
            }

            return mergedWindow[field] !== trackManagementWindow[field]
        })

        if (!changed) {
            return trackManagementWindow
        }

        hasChanges = true
        return mergedWindow
    })

    return hasChanges ? nextWindows : trackManagementWindows
}

export function createTrackFromManagementWindow(trackManagementWindow) {
    return {
        id: trackManagementWindow.trackId,
        trackId: trackManagementWindow.trackId,
        longitude: trackManagementWindow.lngLat.lng,
        latitude: trackManagementWindow.lngLat.lat,
        domain: trackManagementWindow.domain,
        identity: trackManagementWindow.identity,
        type: trackManagementWindow.type,
        specificType: trackManagementWindow.specificType ?? '',
        ...getTrackKinematicFields(trackManagementWindow),
        infoFields: Boolean(trackManagementWindow.infoFields),
        callsign: trackManagementWindow.callsign || trackManagementWindow.trackId,
        correlationMode: trackManagementWindow.correlationMode ?? 'active',
        source: trackManagementWindow.source ?? 'manual',
    }
}

export function createTrackUpdateFromManagementWindow(
    trackManagementWindow,
    existingTrack,
    changedFields,
) {
    const update = {
        id: trackManagementWindow.trackId,
        trackId: trackManagementWindow.trackId,
        longitude: existingTrack?.longitude ?? trackManagementWindow.lngLat.lng,
        latitude: existingTrack?.latitude ?? trackManagementWindow.lngLat.lat,
        domain: trackManagementWindow.domain,
        identity: trackManagementWindow.identity,
        type: trackManagementWindow.type,
        specificType: trackManagementWindow.specificType ?? '',
        ...getTrackKinematicFields(trackManagementWindow, existingTrack, changedFields),
        infoFields: Boolean(trackManagementWindow.infoFields),
        callsign: trackManagementWindow.callsign || trackManagementWindow.trackId,
        correlationMode: trackManagementWindow.correlationMode ?? 'active',
        source: existingTrack?.source === 'auto' ? 'manual' : (trackManagementWindow.source ?? 'manual'),
        userDirected: true,
    }

    if (!existingTrack) {
        return update
    }

    return {
        ...existingTrack,
        ...update,
    }
}
