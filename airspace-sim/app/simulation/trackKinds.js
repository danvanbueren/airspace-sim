export const TRACK_KINDS = {
    TRACK: 'track',
    REFERENCE_POINT: 'referencePoint',
}

export function isReferencePoint(track) {
    return track?.trackKind === TRACK_KINDS.REFERENCE_POINT
}
