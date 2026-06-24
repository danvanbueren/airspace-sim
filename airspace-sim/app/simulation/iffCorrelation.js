import {haversineDistanceNm} from './geo.js'
import {formatMode3Code} from './iffMode3.js'

function buildCorrelationCandidates(detections, tracks, thresholdNm) {
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
                    mode3Code: detection.mode3Code ?? null,
                    trackMode3Code: track.iffMode3Code ?? null,
                })
            }
        })
    })

    return candidates
}

function assignCandidates(candidates, detections) {
    candidates.sort((left, right) => {
        if (left.distanceNm !== right.distanceNm) {
            return left.distanceNm - right.distanceNm
        }

        return left.detectionIndex - right.detectionIndex
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
    const candidates = buildCorrelationCandidates(detections, tracks, thresholdNm)

    return assignCandidates(candidates, detections)
}

/**
 * IFF correlation prefers re-binding tracks to returns carrying their stored Mode 3 code.
 *
 * @param {import('./types.js').SensorDetection[]} detections
 * @param {import('./types.js').TrackState[]} tracks
 * @param {number} thresholdNm
 * @returns {import('./types.js').SensorDetection[]}
 */
export function correlateIffDetections(detections, tracks, thresholdNm) {
    const codeBoundCandidates = []
    const generalCandidates = []

    buildCorrelationCandidates(detections, tracks, thresholdNm).forEach((candidate) => {
        const trackCode = formatMode3Code(candidate.trackMode3Code)
        const detectionCode = formatMode3Code(candidate.mode3Code)

        if (trackCode && detectionCode && trackCode === detectionCode) {
            codeBoundCandidates.push({
                ...candidate,
                codeMatch: true,
            })
            return
        }

        generalCandidates.push(candidate)
    })

    const assignedDetections = new Map()
    const assignedTrackIds = new Set()
    const assignedDetectionIndexes = new Set()

    codeBoundCandidates.sort((left, right) => {
        if (left.distanceNm !== right.distanceNm) {
            return left.distanceNm - right.distanceNm
        }

        return left.detectionIndex - right.detectionIndex
    })

    codeBoundCandidates.forEach((candidate) => {
        if (assignedDetectionIndexes.has(candidate.detectionIndex)
            || assignedTrackIds.has(candidate.trackId)) {
            return
        }

        assignedDetections.set(candidate.detectionIndex, candidate)
        assignedTrackIds.add(candidate.trackId)
        assignedDetectionIndexes.add(candidate.detectionIndex)
    })

    generalCandidates.forEach((candidate) => {
        if (assignedDetectionIndexes.has(candidate.detectionIndex)
            || assignedTrackIds.has(candidate.trackId)) {
            return
        }

        assignedDetections.set(candidate.detectionIndex, candidate)
        assignedTrackIds.add(candidate.trackId)
        assignedDetectionIndexes.add(candidate.detectionIndex)
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

/**
 * Clear stored IFF codes when a track has separated from every return with that code.
 *
 * @param {import('./TrackStore.js').TrackStore} trackStore
 * @param {import('./types.js').SensorDetection[]} detections
 * @param {number} thresholdNm
 * @returns {string[]} Track IDs cleared
 */
export function clearSeparatedIffTrackCodes(trackStore, detections, thresholdNm) {
    const clearedTrackIds = []

    trackStore.getAllTracks().forEach((track) => {
        if (!track.iffMode3Code) {
            return
        }

        const trackCode = formatMode3Code(track.iffMode3Code)
        const hasMatchingDetectionNearby = detections.some((detection) => (
            formatMode3Code(detection.mode3Code) === trackCode
            && haversineDistanceNm(
                track.latitude,
                track.longitude,
                detection.latitude,
                detection.longitude,
            ) <= thresholdNm
        ))

        if (!hasMatchingDetectionNearby) {
            trackStore.updateTrack(track.id, {
                iffMode3Code: null,
                iffMode3UpdatedAt: null,
            })
            clearedTrackIds.push(track.id)
        }
    })

    return clearedTrackIds
}

/**
 * @param {import('./TrackStore.js').TrackStore} trackStore
 * @param {import('./types.js').SensorDetection[]} correlatedDetections
 * @param {number} timestamp
 */
export function applyIffCorrelationFields(trackStore, correlatedDetections, timestamp) {
    correlatedDetections.forEach((detection) => {
        if (!detection.correlated || !detection.correlatedTrackId || !detection.mode3Code) {
            return
        }

        trackStore.updateTrack(detection.correlatedTrackId, {
            iffMode3Code: formatMode3Code(detection.mode3Code),
            iffMode3UpdatedAt: timestamp,
        })
    })
}
