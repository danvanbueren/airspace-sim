export const MAX_TRACK_DELTA_SECONDS = 1

export function getBoundedTrackDeltaSeconds(timestamp, previousTimestamp) {
    const current = Number(timestamp)
    const previous = Number(previousTimestamp)

    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) {
        return 0
    }

    const deltaSeconds = (current - previous) / 1000

    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) {
        return 0
    }

    return Math.min(deltaSeconds, MAX_TRACK_DELTA_SECONDS)
}
