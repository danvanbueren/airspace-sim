import {haversineDistanceNm} from './geo'

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
    return detections.map((detection) => {
        const result = correlateDetection(detection, tracks, thresholdNm)

        return {
            ...detection,
            correlatedTrackId: result.trackId,
            correlated: result.correlated,
            correlationDistanceNm: result.distanceNm,
        }
    })
}
