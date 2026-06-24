export const USER_CORRELATION_HOLD_MS = 10_000

const KINEMATIC_HOLD_FIELDS = new Set([
    'heading',
    'speed',
    'altitude',
    'longitude',
    'latitude',
    'lngLat',
])

export function isKinematicOrPositionField(field) {
    return KINEMATIC_HOLD_FIELDS.has(field)
}

export function getKinematicOrPositionFields(fields = []) {
    return fields.filter((field) => isKinematicOrPositionField(field))
}

export function hasKinematicOrPositionEdit(changedFields) {
    return getKinematicOrPositionFields(changedFields).length > 0
}

export function getCorrelationHoldUntil(track, now = Date.now()) {
    if (!track?.lastUserKinematicEditAt) {
        return 0
    }

    return track.lastUserKinematicEditAt + USER_CORRELATION_HOLD_MS
}

export function isCorrelationHoldActive(track, now = Date.now()) {
    return getCorrelationHoldUntil(track, now) > now
}

function withoutKinematicManagementEditFields(fields = []) {
    return fields.filter((field) => !isKinematicOrPositionField(field))
}

export function getAuthoritativeManagementEditFields(track, now = Date.now()) {
    const fields = track?.lastManagementEditFields ?? []

    if (isCorrelationHoldActive(track, now)) {
        return fields
    }

    return withoutKinematicManagementEditFields(fields)
}

export function resolveExpiredCorrelationHold(track, now = Date.now()) {
    if (!track || isCorrelationHoldActive(track, now)) {
        return track
    }

    const remainingEditFields = withoutKinematicManagementEditFields(track.lastManagementEditFields)
    const hasHoldState = Boolean(track.lastUserKinematicEditAt || track.lastUserKinematicEditFields?.length)
    const hadKinematicEditFields = (track.lastManagementEditFields?.length ?? 0) !== remainingEditFields.length

    if (!hasHoldState && !hadKinematicEditFields) {
        return track
    }

    return {
        ...track,
        lastManagementEditFields: remainingEditFields.length > 0
            ? remainingEditFields
            : undefined,
        lastUserKinematicEditAt: undefined,
        lastUserKinematicEditFields: undefined,
    }
}

export function applyUserKinematicEditHold(trackUpdate, existingTrack, changedFields, now = Date.now()) {
    const kinematicChanges = getKinematicOrPositionFields(changedFields)

    if (kinematicChanges.length === 0) {
        return trackUpdate
    }

    return {
        ...trackUpdate,
        lastUserKinematicEditAt: now,
        lastUserKinematicEditFields: [
            ...new Set([
                ...(existingTrack?.lastUserKinematicEditFields ?? []),
                ...kinematicChanges,
            ]),
        ],
    }
}
