import {SENSOR_TYPES} from './constants'
import {formatMode3Code} from './iffMode3'
import {PlotAssociationStore} from './PlotAssociationStore'
import {trackFromInitiation} from './trackFromDetection'
import {findNearestActiveTrack} from './trackMerge'

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

        const promotions = plotStore.associateDetections(
            detections,
            this.plotAssociationThresholdNm,
            timestamp,
            this.initiationHitCount,
            {
                shouldIgnoreDetection: (detection) => Boolean(
                    findNearestActiveTrack(
                        activeTracks,
                        detection.latitude,
                        detection.longitude,
                        proximityNm,
                    ),
                ),
            },
        )

        const createdTracks = []

        promotions.forEach((promotion) => {
            const existingTrack = findNearestActiveTrack(
                trackStore.getAllTracks(),
                promotion.latitude,
                promotion.longitude,
                proximityNm,
            )

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
