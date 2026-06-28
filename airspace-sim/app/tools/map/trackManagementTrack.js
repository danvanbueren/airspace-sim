import {
    normalizeHeading,
    parseTrackKinematicFields,
    parseWholeNumberInput,
} from '../formatting/trackFieldFormatting.js'
import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    getUnspecifiedTrackTypeForDomain,
    normalizeTrackDomain,
    resolveTrackTypeForDomain,
} from '../milstd2525/trackSymbolCodes.js'
import {
    getDefaultSpecificTypeForTrackType,
    normalizeSpecificType,
} from '../milstd2525/trackSpecificTypes.js'
import {applyUserKinematicEditHold, getAuthoritativeManagementEditFields, isCorrelationHoldActive, resolveExpiredCorrelationHold} from '../../simulation/correlationHold.js'

const KINEMATIC_FIELDS = new Set(['heading', 'speed', 'altitude'])

function resolveTrackClassificationFields(domain, type, specificType) {
    const normalizedDomain = normalizeTrackDomain(domain)
    const resolvedType = resolveTrackTypeForDomain(type, normalizedDomain)

    return {
        domain: normalizedDomain,
        type: resolvedType,
        specificType: normalizeSpecificType(specificType, resolvedType),
    }
}

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
    'attentionFlags',
    'iffMode3Code',
    'iffMode3UpdatedAt',
]

export const TRACK_MANAGEMENT_WINDOW_LIVE_SYNC_INTERVAL_MS = 1000

export const TRACK_MANAGEMENT_COUPLED_LIVE_SKIP_FIELDS = {
    domain: ['type', 'specificType'],
    type: ['specificType'],
}

const COMMITTED_MANAGEMENT_FIELD_TO_LIVE_SKIP_FIELD = {
    longitude: 'lngLat',
    latitude: 'lngLat',
}

const USER_DIRECTED_LAYER_METADATA_FIELDS = [
    'domain',
    'identity',
    'type',
    'specificType',
    'callsign',
    'infoFields',
    'correlationMode',
    'source',
    'userDirected',
    'lastUserEditAt',
]

const LIVE_KINEMATIC_TRACK_FIELDS = [
    'longitude',
    'latitude',
    'heading',
    'speed',
    'altitude',
]

export function expandTrackManagementWindowSkipLiveFields(
    focusedFields,
    kinematicFieldDrafts = {},
    callsignDraft = null,
) {
    const fields = new Set(focusedFields)

    for (const field of Object.keys(kinematicFieldDrafts)) {
        fields.add(field)
    }

    if (callsignDraft !== null) {
        fields.add('callsign')
    }

    for (const field of focusedFields) {
        for (const coupledField of TRACK_MANAGEMENT_COUPLED_LIVE_SKIP_FIELDS[field] ?? []) {
            fields.add(coupledField)
        }
    }

    return fields
}

export function shouldPreferMapLayerTrackForLiveSync(layerTrack) {
    return Boolean(layerTrack?.userDirected || layerTrack?.source === 'manual')
}

export function expandSkipFieldsWithCommittedManagementEdits(
    skipFields,
    lastManagementEditFields = [],
    track = null,
    now = Date.now(),
) {
    const effectiveSkipFields = skipFields instanceof Set ? new Set(skipFields) : new Set(skipFields)
    const committedFields = track
        ? getAuthoritativeManagementEditFields(track, now)
        : lastManagementEditFields

    for (const field of committedFields) {
        const skipField = COMMITTED_MANAGEMENT_FIELD_TO_LIVE_SKIP_FIELD[field] ?? field

        if (TRACK_MANAGEMENT_WINDOW_LIVE_FIELDS.includes(skipField)) {
            effectiveSkipFields.add(skipField)
        }

        for (const coupledField of TRACK_MANAGEMENT_COUPLED_LIVE_SKIP_FIELDS[field] ?? []) {
            effectiveSkipFields.add(coupledField)
        }
    }

    return effectiveSkipFields
}

export function mergeUserDirectedLayerTrackOverSimulation(simulationTrack, layerTrack, now = Date.now()) {
    const merged = {...simulationTrack}
    const layerEditFields = new Set(layerTrack.lastManagementEditFields ?? [])
    const holdActive = isCorrelationHoldActive(simulationTrack, now)

    for (const field of USER_DIRECTED_LAYER_METADATA_FIELDS) {
        if (field in layerTrack) {
            merged[field] = layerTrack[field]
        }
    }

    if (holdActive) {
        for (const field of LIVE_KINEMATIC_TRACK_FIELDS) {
            if (layerEditFields.has(field) && field in layerTrack) {
                merged[field] = layerTrack[field]
            }
        }
    }

    merged.lastManagementEditFields = holdActive
        ? accumulateManagementEditFields(
            simulationTrack.lastManagementEditFields,
            layerTrack.lastManagementEditFields,
        )
        : simulationTrack.lastManagementEditFields

    return merged
}

export function mergeLiveTracksForManagementWindowSync(
    simulationTracks,
    openTrackManagementWindows,
    getMapLayerTrack,
    evaluationTime = Date.now(),
) {
    const tracksById = new Map()

    for (const track of simulationTracks) {
        const trackId = track.trackId ?? track.id

        if (trackId) {
            tracksById.set(trackId, track)
        }
    }

    for (const trackManagementWindow of openTrackManagementWindows) {
        const layerTrack = getMapLayerTrack?.(trackManagementWindow.trackId)

        if (!layerTrack || !shouldPreferMapLayerTrackForLiveSync(layerTrack)) {
            continue
        }

        const existingTrack = tracksById.get(trackManagementWindow.trackId)

        tracksById.set(
            trackManagementWindow.trackId,
            existingTrack
                ? mergeUserDirectedLayerTrackOverSimulation(existingTrack, layerTrack, evaluationTime)
                : layerTrack,
        )
    }

    return Array.from(tracksById.values())
}

function getChangedFieldSet(changedFields) {
    if (!changedFields) {
        return null
    }

    if (changedFields instanceof Set) {
        return changedFields
    }

    return new Set(changedFields)
}

export function accumulateManagementEditFields(existingFields, changedFields) {
    const accumulatedFields = new Set(existingFields ?? [])
    const changedFieldSet = getChangedFieldSet(changedFields)

    if (changedFieldSet) {
        for (const field of changedFieldSet) {
            accumulatedFields.add(field)
        }
    }

    return accumulatedFields.size > 0 ? Array.from(accumulatedFields) : undefined
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
    const {domain, type, specificType} = resolveTrackClassificationFields(
        track.domain ?? TRACK_DOMAINS.AIR,
        track.type ?? getUnspecifiedTrackTypeForDomain(track.domain ?? TRACK_DOMAINS.AIR),
        track.specificType ?? getDefaultSpecificTypeForTrackType(
            track.type ?? getUnspecifiedTrackTypeForDomain(track.domain ?? TRACK_DOMAINS.AIR),
        ),
    )
    const kinematicFields = parseTrackKinematicFields(track)

    return {
        lngLat: {
            lng: track.longitude,
            lat: track.latitude,
        },
        domain,
        identity: track.identity ?? TRACK_IDENTITIES.PENDING,
        type,
        specificType,
        callsign: track.callsign ?? trackId,
        heading: kinematicFields.heading,
        speed: kinematicFields.speed,
        altitude: kinematicFields.altitude,
        infoFields: Boolean(track.infoFields),
        correlationMode: track.correlationMode ?? 'active',
        attentionFlags: Array.isArray(track.attentionFlags) ? track.attentionFlags : [],
        iffMode3Code: track.iffMode3Code ?? null,
        iffMode3UpdatedAt: track.iffMode3UpdatedAt ?? null,
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
    evaluationTime = Date.now(),
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
        const skipFields = expandSkipFieldsWithCommittedManagementEdits(
            skipFieldsByWindowId[trackManagementWindow.id] ?? new Set(),
            liveTrack.lastManagementEditFields,
            liveTrack,
            evaluationTime,
        )
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

            if (field === 'attentionFlags') {
                const previousFlags = trackManagementWindow.attentionFlags ?? []
                const nextFlags = mergedWindow.attentionFlags ?? []

                return previousFlags.length !== nextFlags.length
                    || previousFlags.some((flag, index) => flag !== nextFlags[index])
            }

            if (field === 'iffMode3Code' || field === 'iffMode3UpdatedAt') {
                return mergedWindow[field] !== trackManagementWindow[field]
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
    const {domain, type, specificType} = resolveTrackClassificationFields(
        trackManagementWindow.domain,
        trackManagementWindow.type,
        trackManagementWindow.specificType,
    )

    return {
        id: trackManagementWindow.trackId,
        trackId: trackManagementWindow.trackId,
        longitude: trackManagementWindow.lngLat.lng,
        latitude: trackManagementWindow.lngLat.lat,
        domain,
        identity: trackManagementWindow.identity,
        type,
        specificType,
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
    evaluationTime = Date.now(),
) {
    const {domain, type, specificType} = resolveTrackClassificationFields(
        trackManagementWindow.domain,
        trackManagementWindow.type,
        trackManagementWindow.specificType,
    )

    const update = {
        id: trackManagementWindow.trackId,
        trackId: trackManagementWindow.trackId,
        longitude: existingTrack?.longitude ?? trackManagementWindow.lngLat.lng,
        latitude: existingTrack?.latitude ?? trackManagementWindow.lngLat.lat,
        domain,
        identity: trackManagementWindow.identity,
        type,
        specificType,
        ...getTrackKinematicFields(trackManagementWindow, existingTrack, changedFields),
        infoFields: Boolean(trackManagementWindow.infoFields),
        callsign: trackManagementWindow.callsign || trackManagementWindow.trackId,
        correlationMode: trackManagementWindow.correlationMode ?? 'active',
        source: existingTrack?.source === 'auto' ? 'manual' : (trackManagementWindow.source ?? 'manual'),
        userDirected: true,
        lastManagementEditFields: accumulateManagementEditFields(
            getAuthoritativeManagementEditFields(existingTrack, evaluationTime),
            changedFields,
        ),
    }

    if (!existingTrack) {
        return resolveExpiredCorrelationHold(
            applyUserKinematicEditHold(update, existingTrack, changedFields),
            evaluationTime,
        )
    }

    return resolveExpiredCorrelationHold(
        applyUserKinematicEditHold({
            ...existingTrack,
            ...update,
        }, existingTrack, changedFields),
        evaluationTime,
    )
}
