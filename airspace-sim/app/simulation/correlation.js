import {haversineDistanceNm} from './geo.js'

export function correlateDetection(detection, tracks, thresholdNm) {
    let bestTrackId = null
    let bestDistance = Infinity

    tracks.forEach((track) => {
        const distance = haversineDistanceNm(
            detection.latitude,
            detection.longitude,
            track.latitude,
            track.longitude,
        )

        if (distance <= thresholdNm && distance < bestDistance) {
            bestDistance = distance
            bestTrackId = track.id
        }
    })

    return {
        trackId: bestTrackId,
        distanceNm: bestTrackId ? bestDistance : null,
        correlated: Boolean(bestTrackId),
    }
}

export function correlateDetections(detections, tracks, thresholdNm) {
    const candidates = []

    detections.forEach((detection, detectionIndex) => {
        tracks.forEach((track) => {
            const distance = haversineDistanceNm(
                detection.latitude,
                detection.longitude,
                track.latitude,
                track.longitude,
            )

            if (distance <= thresholdNm) {
                candidates.push({
                    detectionIndex,
                    trackId: track.id,
                    distanceNm: distance,
                })
            }
        })
    })

    candidates.sort((a, b) => {
        if (a.distanceNm !== b.distanceNm) {
            return a.distanceNm - b.distanceNm
        }

        return a.detectionIndex - b.detectionIndex
    })

    const assignedDetections = new Map()
    const assignedTrackIds = new Set()

    candidates.forEach((candidate) => {
        if (assignedDetections.has(candidate.detectionIndex)
            || assignedTrackIds.has(candidate.trackId)) {
            return
        }

        assignedDetections.set(candidate.detectionIndex, candidate)
        assignedTrackIds.add(candidate.trackId)
    })

    return detections.map((detection, detectionIndex) => {
        const result = assignedDetections.get(detectionIndex)

        return {
            ...detection,
            correlatedTrackId: result?.trackId ?? null,
            correlated: Boolean(result),
            correlationDistanceNm: result?.distanceNm ?? null,
        }
    })
}
