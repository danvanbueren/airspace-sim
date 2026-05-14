import {forward} from 'mgrs'

import {
    GRID_REFERENCE_SYSTEMS,
} from '@/app/contexts/AppSettingsContext'

const GEOHASH_BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
const GEOREF_LONGITUDE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const GEOREF_LATITUDE_LETTERS = 'ABCDEFGHJKLM'
const GARS_LONGITUDE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

function normalizeLongitude(lng) {
    return ((((lng + 180) % 360) + 360) % 360) - 180
}

function clampLatitude(lat) {
    return Math.max(-90, Math.min(90, lat))
}

function formatDegrees(value) {
    return String(value).padStart(4, ' ')
}

function formatMinutes(value) {
    return String(value).padStart(2, '0')
}

function formatDecimalMinutes(value) {
    return value.toFixed(4).padStart(7, '0')
}

function formatSeconds(value) {
    return value.toFixed(2).padStart(5, '0')
}

function formatDdCoordinate(value) {
    return `${value.toFixed(5).padStart(10, ' ')}°`
}

function formatDdmCoordinate(value) {
    const absoluteValue = Math.abs(value)
    const degrees = Math.trunc(value)
    const minutes = (absoluteValue - Math.floor(absoluteValue)) * 60

    return `${formatDegrees(degrees)}° ${formatDecimalMinutes(minutes)}'`
}

function formatDmsCoordinate(value, positiveSuffix, negativeSuffix) {
    const absoluteValue = Math.abs(value)
    const degrees = Math.floor(absoluteValue)
    const minutesFloat = (absoluteValue - degrees) * 60
    const minutes = Math.floor(minutesFloat)
    const seconds = (minutesFloat - minutes) * 60
    const suffix = value >= 0 ? positiveSuffix : negativeSuffix

    return `${formatDegrees(degrees)}° ${formatMinutes(minutes)}' ${formatSeconds(seconds)}" ${suffix}`
}

function getGarsLetterPair(latitudeBand) {
    const firstLetterIndex = Math.floor(latitudeBand / GARS_LONGITUDE_LETTERS.length)
    const secondLetterIndex = latitudeBand % GARS_LONGITUDE_LETTERS.length

    return `${GARS_LONGITUDE_LETTERS[firstLetterIndex]}${GARS_LONGITUDE_LETTERS[secondLetterIndex]}`
}

function formatGarsCoordinate(lat, lng) {
    const normalizedLat = Math.min(89.999999999, Math.max(-90, lat))
    const normalizedLng = Math.min(179.999999999, Math.max(-180, normalizeLongitude(lng)))

    const longitudeBand = Math.floor((normalizedLng + 180) * 2) + 1
    const latitudeBand = Math.floor((normalizedLat + 90) * 2)
    const longitudeRemainder = ((normalizedLng + 180) * 2) % 1
    const latitudeRemainder = ((normalizedLat + 90) * 2) % 1

    const quadrantColumn = longitudeRemainder >= 0.5 ? 1 : 0
    const quadrantRow = latitudeRemainder >= 0.5 ? 0 : 1
    const quadrant = quadrantRow * 2 + quadrantColumn + 1

    const keypadColumn = Math.floor((longitudeRemainder % 0.5) / (1 / 6))
    const keypadRow = Math.floor((latitudeRemainder % 0.5) / (1 / 6))
    const keypad = (2 - Math.min(2, keypadRow)) * 3 + Math.min(2, keypadColumn) + 1

    return `${String(longitudeBand).padStart(3, '0')}${getGarsLetterPair(latitudeBand)}${quadrant}${keypad}`
}

function formatGeohashCoordinate(lat, lng, precision = 10) {
    let latitudeRange = [-90, 90]
    let longitudeRange = [-180, 180]
    let geohash = ''
    let bit = 0
    let characterIndex = 0
    let evenBit = true

    while (geohash.length < precision) {
        if (evenBit) {
            const midpoint = (longitudeRange[0] + longitudeRange[1]) / 2

            if (lng >= midpoint) {
                characterIndex = (characterIndex << 1) + 1
                longitudeRange[0] = midpoint
            } else {
                characterIndex = characterIndex << 1
                longitudeRange[1] = midpoint
            }
        } else {
            const midpoint = (latitudeRange[0] + latitudeRange[1]) / 2

            if (lat >= midpoint) {
                characterIndex = (characterIndex << 1) + 1
                latitudeRange[0] = midpoint
            } else {
                characterIndex = characterIndex << 1
                latitudeRange[1] = midpoint
            }
        }

        evenBit = !evenBit

        if (++bit === 5) {
            geohash += GEOHASH_BASE32[characterIndex]
            bit = 0
            characterIndex = 0
        }
    }

    return geohash
}

function formatGeorefCoordinate(lat, lng) {
    const normalizedLat = Math.min(89.999999999, Math.max(-90, lat))
    const normalizedLng = Math.min(179.999999999, Math.max(-180, normalizeLongitude(lng)))

    const longitude = normalizedLng + 180
    const latitude = normalizedLat + 90

    const longitude15DegreeIndex = Math.floor(longitude / 15)
    const latitude15DegreeIndex = Math.floor(latitude / 15)

    const longitudeRemainder = longitude - longitude15DegreeIndex * 15
    const latitudeRemainder = latitude - latitude15DegreeIndex * 15

    const longitudeDegree = Math.floor(longitudeRemainder)
    const latitudeDegree = Math.floor(latitudeRemainder)

    const longitudeMinutes = Math.floor((longitudeRemainder - longitudeDegree) * 60)
    const latitudeMinutes = Math.floor((latitudeRemainder - latitudeDegree) * 60)

    return [
        GEOREF_LONGITUDE_LETTERS[longitude15DegreeIndex],
        GEOREF_LATITUDE_LETTERS[latitude15DegreeIndex],
        GEOREF_LONGITUDE_LETTERS[longitudeDegree],
        GEOREF_LATITUDE_LETTERS[latitudeDegree],
        String(longitudeMinutes).padStart(2, '0'),
        String(latitudeMinutes).padStart(2, '0'),
    ].join('')
}

function formatKillboxCoordinate(lat, lng) {
    return `${formatGarsCoordinate(lat, lng)}`
}

function formatMgrsCoordinate(lat, lng) {
    try {
        return forward([normalizeLongitude(lng), clampLatitude(lat)], 5)
    } catch (error) {
        return 'Invalid MGRS Coordinate'
    }
}

export function getGridReferenceSystemDisplayName(gridReferenceSystem) {
    const system = GRID_REFERENCE_SYSTEMS[gridReferenceSystem] ?? GRID_REFERENCE_SYSTEMS.dd

    return system.label
}

export function formatCoordinatePairForGridReferenceSystem(lat, lng, gridReferenceSystem) {
    switch (gridReferenceSystem) {

        case GRID_REFERENCE_SYSTEMS.dd.value:
            return [`LAT: ${formatDdCoordinate(lat)}`, `LNG: ${formatDdCoordinate(lng)}`,]

        case GRID_REFERENCE_SYSTEMS.ddm.value:
            return [`LAT: ${formatDdmCoordinate(lat)}`, `LNG: ${formatDdmCoordinate(lng)}`,]

        case GRID_REFERENCE_SYSTEMS.dms.value:
            return [`LAT: ${formatDmsCoordinate(lat, 'N', 'S')}`, `LNG: ${formatDmsCoordinate(lng, 'E', 'W')}`,]

        case GRID_REFERENCE_SYSTEMS.gars.value:
            return [`${formatGarsCoordinate(lat, lng)}`,]

        case GRID_REFERENCE_SYSTEMS.geohash.value:
            return [`${formatGeohashCoordinate(lat, lng)}`,]

        case GRID_REFERENCE_SYSTEMS.georef.value:
            return [`${formatGeorefCoordinate(lat, lng)}`,]

        case GRID_REFERENCE_SYSTEMS.killbox.value:
            return [`${formatKillboxCoordinate(lat, lng)}`,]

        case GRID_REFERENCE_SYSTEMS.mgrs.value:
            return [`${formatMgrsCoordinate(lat, lng)}`,]

        default:
            return [`${getGridReferenceSystemDisplayName(gridReferenceSystem)} unknown`,]
    }
}