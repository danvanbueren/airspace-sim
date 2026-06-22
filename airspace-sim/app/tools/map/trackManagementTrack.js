import {
    normalizeHeading,
    parseWholeNumberInput,
} from '../formatting/trackFieldFormatting.js'

const KINEMATIC_FIELDS = new Set(['heading', 'speed', 'altitude'])

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
