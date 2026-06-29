import {forward, inverse} from 'mgrs'

import {
    GRID_REFERENCE_SYSTEMS,
} from '../../constants/gridReferenceSystems.js'

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

function formatDdCoordinate(value) {
    return `${value.toFixed(5)}°`
}

function formatDdmCoordinate(value) {
    const absoluteValue = Math.abs(value)
    const degrees = Math.trunc(value)
    const minutes = (absoluteValue - Math.floor(absoluteValue)) * 60

    return `${degrees}° ${minutes.toFixed(3)}'`
}

function formatDmsCoordinate(value, positiveSuffix, negativeSuffix) {
    const absoluteValue = Math.abs(value)
    const degrees = Math.floor(absoluteValue)
    const minutesFloat = (absoluteValue - degrees) * 60
    const minutes = Math.floor(minutesFloat)
    const seconds = (minutesFloat - minutes) * 60
    const suffix = value >= 0 ? positiveSuffix : negativeSuffix

    return `${degrees}° ${minutes}' ${seconds.toFixed(1)}" ${suffix}`
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

export function formatPositionTextForGridReferenceSystem(lat, lng, gridReferenceSystem) {
    return formatCoordinatePairForGridReferenceSystem(lat, lng, gridReferenceSystem).join('\n')
}

function validateLatLng(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return {error: 'Enter a valid position'}
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return {error: 'Coordinates are out of range'}
    }

    return {lat, lng}
}

function stripCoordinatePrefix(line) {
    return String(line ?? '').replace(/^\s*(?:LAT|LNG):\s*/i, '').trim()
}

function parseSignedDecimal(value) {
    const parsed = Number.parseFloat(String(value).replace(/[^\d.+-]/g, ''))

    return Number.isFinite(parsed) ? parsed : null
}

function parseDdCoordinates(lines) {
    let lat = null
    let lng = null

    for (const line of lines) {
        const stripped = stripCoordinatePrefix(line)
        const latMatch = line.match(/^LAT:\s*([+-]?\d+(?:\.\d+)?)/i)
        const lngMatch = line.match(/^LNG:\s*([+-]?\d+(?:\.\d+)?)/i)

        if (latMatch) {
            lat = parseFloat(latMatch[1])
        } else if (lngMatch) {
            lng = parseFloat(lngMatch[1])
        } else if (lat === null) {
            lat = parseSignedDecimal(stripped)
        } else if (lng === null) {
            lng = parseSignedDecimal(stripped)
        }
    }

    return validateLatLng(lat, lng)
}

function parseDdmLine(line) {
    const cleaned = stripCoordinatePrefix(line)
    const match = cleaned.match(/^([+-]?\d+)\s*°\s*(\d+(?:\.\d+)?)\s*'?$/)

    if (!match) {
        return null
    }

    const degrees = Number.parseInt(match[1], 10)
    const minutes = Number.parseFloat(match[2])
    const sign = degrees < 0 ? -1 : 1

    return sign * (Math.abs(degrees) + minutes / 60)
}

function parseDdmCoordinates(lines) {
    if (lines.length < 2) {
        return {error: 'Enter latitude and longitude'}
    }

    const lat = parseDdmLine(lines[0])
    const lng = parseDdmLine(lines[1])

    return validateLatLng(lat, lng)
}

function parseDmsLine(line) {
    const cleaned = stripCoordinatePrefix(line)
    const match = cleaned.match(
        /^([+-]?\d+)\s*°\s*(\d+)\s*'\s*(\d+(?:\.\d+)?)\s*"\s*([NSEW])?/i,
    )

    if (!match) {
        return null
    }

    const degrees = Number.parseInt(match[1], 10)
    const minutes = Number.parseInt(match[2], 10)
    const seconds = Number.parseFloat(match[3])
    const hemisphere = match[4]?.toUpperCase()
    let value = Math.abs(degrees) + minutes / 60 + seconds / 3600

    if (degrees < 0) {
        value *= -1
    } else if (hemisphere === 'S' || hemisphere === 'W') {
        value *= -1
    }

    return value
}

function parseDmsCoordinates(lines) {
    if (lines.length < 2) {
        return {error: 'Enter latitude and longitude'}
    }

    const lat = parseDmsLine(lines[0])
    const lng = parseDmsLine(lines[1])

    return validateLatLng(lat, lng)
}

function getLatitudeBandFromLetterPair(letterPair) {
    const normalized = String(letterPair ?? '').toUpperCase()

    if (normalized.length !== 2) {
        return null
    }

    for (let latitudeBand = 0; latitudeBand < 360; latitudeBand += 1) {
        if (getGarsLetterPair(latitudeBand) === normalized) {
            return latitudeBand
        }
    }

    return null
}

function parseGarsCoordinate(text) {
    const normalized = String(text ?? '').trim().toUpperCase()

    if (!/^\d{3}[A-Z]{2}\d\d$/.test(normalized)) {
        return {error: 'Enter a valid GARS coordinate'}
    }

    const longitudeBand = Number.parseInt(normalized.slice(0, 3), 10)
    const latitudeBand = getLatitudeBandFromLetterPair(normalized.slice(3, 5))
    const quadrant = Number.parseInt(normalized.slice(5, 6), 10)
    const keypad = Number.parseInt(normalized.slice(6, 7), 10)

    if (!latitudeBand || quadrant < 1 || quadrant > 4 || keypad < 1 || keypad > 9) {
        return {error: 'Enter a valid GARS coordinate'}
    }

    const quadrantColumn = (quadrant - 1) % 2
    const quadrantRow = Math.floor((quadrant - 1) / 2)
    const keypadColumn = (keypad - 1) % 3
    const keypadRow = 2 - Math.floor((keypad - 1) / 3)

    const lng = (longitudeBand - 1) / 2 - 180 + (quadrantColumn * 0.5) + ((keypadColumn + 0.5) / 6) * 0.5
    const lat = latitudeBand / 2 - 90 + (1 - quadrantRow) * 0.5 + ((keypadRow + 0.5) / 6) * 0.5

    return validateLatLng(lat, lng)
}

function decodeGeohashBounds(geohash) {
    let latitudeRange = [-90, 90]
    let longitudeRange = [-180, 180]
    let evenBit = true

    for (const character of geohash.toLowerCase()) {
        const characterIndex = GEOHASH_BASE32.indexOf(character)

        if (characterIndex === -1) {
            return null
        }

        for (let mask = 16; mask >= 1; mask >>= 1) {
            if (evenBit) {
                const midpoint = (longitudeRange[0] + longitudeRange[1]) / 2

                if (characterIndex & mask) {
                    longitudeRange[0] = midpoint
                } else {
                    longitudeRange[1] = midpoint
                }
            } else {
                const midpoint = (latitudeRange[0] + latitudeRange[1]) / 2

                if (characterIndex & mask) {
                    latitudeRange[0] = midpoint
                } else {
                    latitudeRange[1] = midpoint
                }
            }

            evenBit = !evenBit
        }
    }

    return [latitudeRange[0], latitudeRange[1], longitudeRange[0], longitudeRange[1]]
}

function parseGeohashCoordinate(text) {
    const normalized = String(text ?? '').trim().toLowerCase()

    if (!normalized || /[^0123456789bcdefghjkmnpqrstuvwxyz]/.test(normalized)) {
        return {error: 'Enter a valid geohash'}
    }

    const bounds = decodeGeohashBounds(normalized)

    if (!bounds) {
        return {error: 'Enter a valid geohash'}
    }

    return validateLatLng(
        (bounds[0] + bounds[1]) / 2,
        (bounds[2] + bounds[3]) / 2,
    )
}

function parseGeorefCoordinate(text) {
    const normalized = String(text ?? '').trim().toUpperCase()

    if (normalized.length !== 8) {
        return {error: 'Enter a valid GEOREF coordinate'}
    }

    const longitude15DegreeIndex = GEOREF_LONGITUDE_LETTERS.indexOf(normalized[0])
    const latitude15DegreeIndex = GEOREF_LATITUDE_LETTERS.indexOf(normalized[1])
    const longitudeDegree = GEOREF_LONGITUDE_LETTERS.indexOf(normalized[2])
    const latitudeDegree = GEOREF_LATITUDE_LETTERS.indexOf(normalized[3])
    const longitudeMinutes = Number.parseInt(normalized.slice(4, 6), 10)
    const latitudeMinutes = Number.parseInt(normalized.slice(6, 8), 10)

    if (
        longitude15DegreeIndex === -1
        || latitude15DegreeIndex === -1
        || longitudeDegree === -1
        || latitudeDegree === -1
        || !Number.isFinite(longitudeMinutes)
        || !Number.isFinite(latitudeMinutes)
    ) {
        return {error: 'Enter a valid GEOREF coordinate'}
    }

    const lng = longitude15DegreeIndex * 15 + longitudeDegree + longitudeMinutes / 60 - 180
    const lat = latitude15DegreeIndex * 15 + latitudeDegree + latitudeMinutes / 60 - 90

    return validateLatLng(lat, lng)
}

function parseMgrsCoordinate(text) {
    const normalized = String(text ?? '').trim().toUpperCase()

    if (!normalized) {
        return {error: 'Enter a valid MGRS coordinate'}
    }

    try {
        const bbox = inverse(normalized)
        const lng = (bbox[0] + bbox[2]) / 2
        const lat = (bbox[1] + bbox[3]) / 2

        return validateLatLng(lat, lng)
    } catch (error) {
        return {error: 'Enter a valid MGRS coordinate'}
    }
}

export function parsePositionTextForGridReferenceSystem(text, gridReferenceSystem) {
    const trimmed = String(text ?? '').trim()

    if (!trimmed) {
        return {error: 'Position is required'}
    }

    const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean)

    switch (gridReferenceSystem) {
        case GRID_REFERENCE_SYSTEMS.dd.value:
            return parseDdCoordinates(lines)

        case GRID_REFERENCE_SYSTEMS.ddm.value:
            return parseDdmCoordinates(lines)

        case GRID_REFERENCE_SYSTEMS.dms.value:
            return parseDmsCoordinates(lines)

        case GRID_REFERENCE_SYSTEMS.gars.value:
            return parseGarsCoordinate(lines[0])

        case GRID_REFERENCE_SYSTEMS.geohash.value:
            return parseGeohashCoordinate(lines[0])

        case GRID_REFERENCE_SYSTEMS.georef.value:
            return parseGeorefCoordinate(lines[0])

        case GRID_REFERENCE_SYSTEMS.killbox.value:
            return parseGarsCoordinate(lines[0])

        case GRID_REFERENCE_SYSTEMS.mgrs.value:
            return parseMgrsCoordinate(lines[0])

        default:
            return {error: `${getGridReferenceSystemDisplayName(gridReferenceSystem)} parsing is not supported`}
    }
}

export function formatCoordinatePairForGridReferenceSystem(lat, lng, gridReferenceSystem) {
    switch (gridReferenceSystem) {

        case GRID_REFERENCE_SYSTEMS.dd.value:
            return [formatDdCoordinate(lat), formatDdCoordinate(lng)]

        case GRID_REFERENCE_SYSTEMS.ddm.value:
            return [formatDdmCoordinate(lat), formatDdmCoordinate(lng)]

        case GRID_REFERENCE_SYSTEMS.dms.value:
            return [
                formatDmsCoordinate(lat, 'N', 'S'),
                formatDmsCoordinate(lng, 'E', 'W'),
            ]

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