import {SENSOR_TYPES} from './constants'
import {offsetLngLat} from './geo'

const SENSOR_NOISE_PROFILES = {
    [SENSOR_TYPES.RADAR]: {
        positionErrorNm: 0.35,
        dropProbability: 0.08,
        bearingJitterDegrees: 4,
    },
    [SENSOR_TYPES.IFF]: {
        positionErrorNm: 0.12,
        dropProbability: 0.02,
        bearingJitterDegrees: 1.5,
    },
}

function mulberry32(seed) {
    let value = seed >>> 0

    return () => {
        value += 0x6D2B79F5
        let t = value
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function hashSeed(parts) {
    const text = parts.join(':')
    let hash = 0

    for (let index = 0; index < text.length; index += 1) {
        hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0
    }

    return hash
}

export function createSeededRandom(...parts) {
    return mulberry32(hashSeed(parts))
}

export function applySensorNoise(truth, sensorType, scanTimestamp) {
    const profile = SENSOR_NOISE_PROFILES[sensorType]
    const random = createSeededRandom(truth.id, sensorType, scanTimestamp)

    if (random() < profile.dropProbability) {
        return null
    }

    const bearingJitter = (random() - 0.5) * 2 * profile.bearingJitterDegrees
    const rangeErrorNm = (random() - 0.5) * 2 * profile.positionErrorNm
    const bearing = truth.heading + bearingJitter

    const measuredPosition = offsetLngLat(
        truth.longitude,
        truth.latitude,
        bearing,
        Math.abs(rangeErrorNm),
    )

    return {
        longitude: measuredPosition.lng,
        latitude: measuredPosition.lat,
        quality: 1 - Math.abs(rangeErrorNm) / (profile.positionErrorNm * 2 + 0.001),
    }
}
