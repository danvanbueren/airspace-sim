import {SENSOR_TYPES} from './constants.js'
import {correlateDetections} from './correlation.js'
import {
    applyIffCorrelationFields,
    clearSeparatedIffTrackCodes,
    correlateIffDetections,
} from './iffCorrelation.js'
import {isCorrelationHoldActive} from './correlationHold.js'
import {TRACK_CORRELATION_MODES} from './trackFromDetection.js'

export class CorrelationService {
    apply(detections, trackStore, thresholdNm, timestamp, sensorType) {
        const correlationTargets = trackStore
            .getAllTracks()
            .filter((track) => track.correlationMode === TRACK_CORRELATION_MODES.ACTIVE)

        const correlatedDetections = sensorType === SENSOR_TYPES.IFF
            ? correlateIffDetections(detections, correlationTargets, thresholdNm)
            : correlateDetections(detections, correlationTargets, thresholdNm)

        correlatedDetections.forEach((detection) => {
            if (!detection.correlated || !detection.correlatedTrackId) {
                return
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
        })

        if (sensorType === SENSOR_TYPES.IFF) {
            applyIffCorrelationFields(trackStore, correlatedDetections, timestamp)
            clearSeparatedIffTrackCodes(trackStore, detections, thresholdNm, {
                correlatedDetections,
                timestamp,
            })
        }

        return correlatedDetections
    }
}

export function createCorrelationService() {
    return new CorrelationService()
}
