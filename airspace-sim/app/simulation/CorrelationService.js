import {correlateDetections} from './correlation.js'
import {isCorrelationHoldActive} from './correlationHold.js'
import {TRACK_CORRELATION_MODES} from './trackFromDetection.js'

export class CorrelationService {
    apply(detections, trackStore, thresholdNm, timestamp) {
        const correlationTargets = trackStore
            .getAllTracks()
            .filter((track) => track.correlationMode === TRACK_CORRELATION_MODES.ACTIVE)

        return correlateDetections(detections, correlationTargets, thresholdNm)
            .map((detection) => {
                if (!detection.correlated || !detection.correlatedTrackId) {
                    return detection
                }

                const existing = trackStore.getTrack(detection.correlatedTrackId)

                if (existing && !isCorrelationHoldActive(existing, timestamp)) {
                    trackStore.updateTrack(detection.correlatedTrackId, {
                        longitude: detection.longitude,
                        latitude: detection.latitude,
                        lastSensorUpdateAt: timestamp,
                        lastExtrapolationAt: timestamp,
                        stale: false,
                        correlated: true,
                    })
                } else if (existing) {
                    trackStore.updateTrack(detection.correlatedTrackId, {
                        correlated: true,
                    })
                }

                return detection
            })
    }
}

export function createCorrelationService() {
    return new CorrelationService()
}
