import {createSeededRandom, applySensorNoise} from './sensorNoise'
import {isPointInBounds} from './geo'
import {TRACK_DOMAINS, TRACK_IDENTITIES, TRACK_TYPES} from '@/app/tools/milstd2525/trackSymbolCodes'

const CIVILIAN_PROFILES = ['civilian', 'commercial']
const MILITARY_PROFILES = ['fighter', 'tanker', 'transport']

function createTruthAircraft(id, lng, lat, random) {
    const isMilitary = random() < 0.25
    const profilePool = isMilitary ? MILITARY_PROFILES : CIVILIAN_PROFILES

    return {
        id,
        longitude: lng,
        latitude: lat,
        heading: Math.floor(random() * 360),
        speed: 180 + Math.floor(random() * 320),
        altitude: 10000 + Math.floor(random() * 25000),
        profile: profilePool[Math.floor(random() * profilePool.length)],
        domain: TRACK_DOMAINS.AIR,
        identity: isMilitary ? TRACK_IDENTITIES.UNKNOWN : TRACK_IDENTITIES.NEUTRAL,
        type: TRACK_TYPES.FIGHTER,
    }
}

export class InAppSyntheticFeed {
    constructor() {
        this.truthAircraft = new Map()
        this.nextSpawnIndex = 0
    }

    ensureViewportPopulation(bounds, maxCount) {
        if (!bounds) {
            return []
        }

        const removedIds = []

        for (const [id, truth] of this.truthAircraft.entries()) {
            if (!isPointInBounds(truth.longitude, truth.latitude, bounds)) {
                this.truthAircraft.delete(id)
                removedIds.push(id)
            }
        }

        const random = createSeededRandom(
            Math.floor(bounds.west * 100),
            Math.floor(bounds.south * 100),
            maxCount,
        )

        while (this.truthAircraft.size < maxCount) {
            const id = `GHOST-${this.nextSpawnIndex}`
            this.nextSpawnIndex += 1

            const lng = bounds.west + random() * (bounds.east - bounds.west)
            const lat = bounds.south + random() * (bounds.north - bounds.south)

            this.truthAircraft.set(id, createTruthAircraft(id, lng, lat, random))
        }

        return removedIds
    }

    trimToMax(maxCount) {
        if (this.truthAircraft.size <= maxCount) {
            return []
        }

        const removedIds = []
        const keys = Array.from(this.truthAircraft.keys())
        const excessCount = this.truthAircraft.size - maxCount

        for (let index = keys.length - excessCount; index < keys.length; index += 1) {
            const id = keys[index]
            this.truthAircraft.delete(id)
            removedIds.push(id)
        }

        return removedIds
    }

    advanceTruth(deltaSeconds, bounds) {
        this.truthAircraft.forEach((truth) => {
            const speed = truth.speed ?? 0
            const distanceNm = (speed * deltaSeconds) / 3600
            const headingRadians = (truth.heading * Math.PI) / 180
            const latRadians = truth.latitude * (Math.PI / 180)
            const earthRadiusNm = 3440.065
            const distanceRadians = distanceNm / earthRadiusNm

            const nextLatRadians = Math.asin(
                Math.sin(latRadians) * Math.cos(distanceRadians)
                + Math.cos(latRadians) * Math.sin(distanceRadians) * Math.cos(headingRadians),
            )
            const nextLngRadians = (truth.longitude * Math.PI / 180) + Math.atan2(
                Math.sin(headingRadians) * Math.sin(distanceRadians) * Math.cos(latRadians),
                Math.cos(distanceRadians) - Math.sin(latRadians) * Math.sin(nextLatRadians),
            )

            truth.latitude = nextLatRadians * (180 / Math.PI)
            truth.longitude = nextLngRadians * (180 / Math.PI)

            if (bounds && !isPointInBounds(truth.longitude, truth.latitude, bounds)) {
                truth.heading = (truth.heading + 135 + Math.floor(Math.random() * 90)) % 360
            }
        })
    }

    scan({bounds, timestamp, sensorType}) {
        if (!bounds) {
            return []
        }

        const detections = []
        let detectionIndex = 0

        this.truthAircraft.forEach((truth) => {
            if (!isPointInBounds(truth.longitude, truth.latitude, bounds)) {
                return
            }

            const noisy = applySensorNoise(truth, sensorType, timestamp)

            if (!noisy) {
                return
            }

            detections.push({
                id: `${sensorType}-${truth.id}-${timestamp}-${detectionIndex}`,
                sensorType,
                timestamp,
                longitude: noisy.longitude,
                latitude: noisy.latitude,
                truthId: truth.id,
                correlatedTrackId: null,
                correlated: false,
                quality: noisy.quality,
            })

            detectionIndex += 1
        })

        return detections
    }

    getTruthStates() {
        return Array.from(this.truthAircraft.values())
    }

    dispose() {
        this.truthAircraft.clear()
    }
}

export function createInAppSyntheticFeed() {
    return new InAppSyntheticFeed()
}
