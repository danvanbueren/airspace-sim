import {applySensorNoise} from './sensorNoise'
import {isPointInBounds} from './geo'

export class SensorSimulator {
    scan({aircraftInBounds, timestamp, sensorType}) {
        if (!aircraftInBounds?.length) {
            return []
        }

        const detections = []
        let detectionIndex = 0

        aircraftInBounds.forEach((aircraft) => {
            const noisy = applySensorNoise(aircraft, sensorType, timestamp)

            if (!noisy) {
                return
            }

            detections.push({
                id: `${sensorType}-${aircraft.id}-${timestamp}-${detectionIndex}`,
                sensorType,
                timestamp,
                longitude: noisy.longitude,
                latitude: noisy.latitude,
                correlatedTrackId: null,
                correlated: false,
                quality: noisy.quality,
            })

            detectionIndex += 1
        })

        return detections
    }

    filterAircraftByBounds(aircraft, bounds) {
        if (!bounds) {
            return aircraft
        }

        return aircraft.filter((item) => (
            isPointInBounds(item.longitude, item.latitude, bounds)
        ))
    }
}

export function createSensorSimulator() {
    return new SensorSimulator()
}
