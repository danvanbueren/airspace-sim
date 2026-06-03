import {haversineDistanceNm} from './geo'

const DEFAULT_MAX_PLOT_AGE_MS = 120000

export class PlotAssociationStore {
    constructor(sensorType) {
        this.sensorType = sensorType
        this.plots = new Map()
        this.nextPlotIndex = 0
    }

    associateDetections(detections, thresholdNm, timestamp, initiationHitCount, options = {}) {
        const {shouldIgnoreDetection} = options
        const promotedTracks = []
        const maxPlotAgeMs = DEFAULT_MAX_PLOT_AGE_MS

        this.pruneStalePlots(timestamp, maxPlotAgeMs)

        detections.forEach((detection) => {
            if (shouldIgnoreDetection?.(detection)) {
                return
            }

            const plot = this.findBestPlot(detection, thresholdNm, timestamp, maxPlotAgeMs)

            if (!plot) {
                const plotId = `${this.sensorType}-PLOT-${this.nextPlotIndex}`
                this.nextPlotIndex += 1

                const created = {
                    id: plotId,
                    sensorType: this.sensorType,
                    longitude: detection.longitude,
                    latitude: detection.latitude,
                    hitCount: 1,
                    lastSeenAt: timestamp,
                    lastDetectionId: detection.id,
                }

                this.plots.set(plotId, created)
                return
            }

            plot.longitude = detection.longitude
            plot.latitude = detection.latitude
            plot.hitCount += 1
            plot.lastSeenAt = timestamp
            plot.lastDetectionId = detection.id

            if (plot.hitCount >= initiationHitCount && !plot.promoted) {
                plot.promoted = true
                promotedTracks.push({
                    plotId: plot.id,
                    sensorType: this.sensorType,
                    longitude: detection.longitude,
                    latitude: detection.latitude,
                    timestamp,
                    lastDetectionId: detection.id,
                })
            }
        })

        return promotedTracks
    }

    findBestPlot(detection, thresholdNm, timestamp, maxPlotAgeMs) {
        let bestPlot = null
        let bestDistance = Infinity

        this.plots.forEach((plot) => {
            if (plot.promoted) {
                return
            }

            if (timestamp - plot.lastSeenAt > maxPlotAgeMs) {
                return
            }

            const distance = haversineDistanceNm(
                detection.latitude,
                detection.longitude,
                plot.latitude,
                plot.longitude,
            )

            if (distance <= thresholdNm && distance < bestDistance) {
                bestDistance = distance
                bestPlot = plot
            }
        })

        return bestPlot
    }

    pruneStalePlots(timestamp, maxPlotAgeMs) {
        this.plots.forEach((plot, plotId) => {
            if (timestamp - plot.lastSeenAt > maxPlotAgeMs) {
                this.plots.delete(plotId)
            }
        })
    }

    resetPlot(plotId) {
        this.plots.delete(plotId)
    }

    absorbPlotsNearPosition(latitude, longitude, thresholdNm) {
        this.plots.forEach((plot) => {
            if (plot.promoted) {
                return
            }

            const distance = haversineDistanceNm(
                latitude,
                longitude,
                plot.latitude,
                plot.longitude,
            )

            if (distance <= thresholdNm) {
                plot.promoted = true
                plot.absorbedByExistingTrack = true
            }
        })
    }

    clear() {
        this.plots.clear()
    }
}
