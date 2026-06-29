import {SENSOR_TYPES} from './constants'
import {formatMode3Code, isEmergencyMode3Code} from './iffMode3'
import {PlotAssociationStore} from './PlotAssociationStore'
import {trackFromInitiation, TRACK_CORRELATION_MODES} from './trackFromDetection'
import {findNearestCorrelatedActiveTrack} from './trackMerge'

export class TrackInitiationService {
    constructor(options = {}) {
        this.initiationHitCount = options.initiationHitCount ?? 3
        this.plotAssociationThresholdNm = options.plotAssociationThresholdNm ?? 3
        this.plotStores = {
            [SENSOR_TYPES.RADAR]: new PlotAssociationStore(SENSOR_TYPES.RADAR),
            [SENSOR_TYPES.IFF]: new PlotAssociationStore(SENSOR_TYPES.IFF),
        }
        this.flightWorld = options.flightWorld ?? null
    }

    setFlightWorld(flightWorld) {
        this.flightWorld = flightWorld
    }

    ingest(sensorType, detections, timestamp, trackStore, options = {}) {
        const plotStore = this.plotStores[sensorType]
        const proximityNm = options.proximityNm ?? this.plotAssociationThresholdNm

        if (!plotStore) {
            return []
        }

        const activeTracks = trackStore.getAllTracks()
        const shouldIgnoreDetection = (detection) => {
            if (isEmergencyMode3Code(detection.mode3Code)) {
                return false
            }

            const nearestTrack = findNearestCorrelatedActiveTrack(
                activeTracks,
                detection.latitude,
                detection.longitude,
                proximityNm,
            )

            if (!nearestTrack?.truthAircraftId || !this.flightWorld) {
                return false
            }

            const nearestAircraft = this.flightWorld.findNearestAircraft?.(
                detection.longitude,
                detection.latitude,
                proximityNm,
            )

            return Boolean(
                nearestAircraft
                && nearestTrack.truthAircraftId === nearestAircraft.id,
            )
        }

        const promotions = plotStore.associateDetections(
            detections,
            this.plotAssociationThresholdNm,
            timestamp,
            this.initiationHitCount,
            {shouldIgnoreDetection},
        )

        const createdTracks = []

        promotions.forEach((promotion) => {
            const nearestAircraft = this.flightWorld?.findNearestAircraft?.(
                promotion.longitude,
                promotion.latitude,
                proximityNm,
            )
            const existingTrack = nearestAircraft
                ? trackStore.getAllTracks().find((track) => (
                    track.correlated === true
                    && track.correlationMode === TRACK_CORRELATION_MODES.ACTIVE
                    && track.truthAircraftId === nearestAircraft.id
                ))
                : null

            if (existingTrack) {
                plotStore.absorbPlotsNearPosition(
                    promotion.latitude,
                    promotion.longitude,
                    this.plotAssociationThresholdNm,
                )
                return
            }

            const trackId = `TRK-${promotion.sensorType}-${promotion.plotId}`

            if (trackStore.has(trackId)) {
                return
            }

            const track = trackFromInitiation({
                ...promotion,
                mode3Code: promotion.mode3Code ? formatMode3Code(promotion.mode3Code) : null,
                flightWorld: this.flightWorld,
                correlationThresholdNm: options.correlationThresholdNm ?? 5,
            })

            trackStore.addTrack(track)
            createdTracks.push(track)

            plotStore.absorbPlotsNearPosition(
                promotion.latitude,
                promotion.longitude,
                this.plotAssociationThresholdNm,
            )
        })

        return createdTracks
    }

    absorbPlotsNearCorrelatedDetections(detections, proximityNm) {
        detections.forEach((detection) => {
            if (!detection.correlated) {
                return
            }

            Object.values(this.plotStores).forEach((plotStore) => {
                plotStore.absorbPlotsNearPosition(
                    detection.latitude,
                    detection.longitude,
                    proximityNm,
                )
            })
        })
    }

    clear() {
        Object.values(this.plotStores).forEach((store) => store.clear())
    }
}
