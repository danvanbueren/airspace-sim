import {correlateDetection} from './correlation'
import {TRACK_CORRELATION_MODES} from './trackFromDetection'

export class CorrelationService {
    apply(detections, trackStore, thresholdNm, timestamp) {
        const correlationTargets = trackStore
            .getAllTracks()
            .filter((track) => track.correlationMode === TRACK_CORRELATION_MODES.ACTIVE)

        return detections.map((detection) => {
            const result = correlateDetection(detection, correlationTargets, thresholdNm)

            if (!result.correlated || !result.trackId) {
                return {
                    ...detection,
                    correlated: false,
                    correlatedTrackId: null,
                    correlationDistanceNm: null,
                }
            }

            const existing = trackStore.getTrack(result.trackId)

            if (existing) {
                trackStore.updateTrack(result.trackId, {
                    longitude: detection.longitude,
                    latitude: detection.latitude,
                    lastSensorUpdateAt: timestamp,
                    lastExtrapolationAt: timestamp,
                    stale: false,
                    correlated: true,
                })
            }

            return {
                ...detection,
                correlated: true,
                correlatedTrackId: result.trackId,
                correlationDistanceNm: result.distanceNm,
            }
        })
    }
}

export function createCorrelationService() {
    return new CorrelationService()
}
