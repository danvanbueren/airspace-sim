function toRadians(value) {
    return value * Math.PI / 180
}

function toDegrees(value) {
    return value * 180 / Math.PI
}

function normalizeBearing(value) {
    return (value + 360) % 360
}

export function normalizeLongitudeToShortestPath(startLng, endLng) {
    let normalizedEndLng = endLng

    while (normalizedEndLng - startLng > 180) normalizedEndLng -= 360
    while (normalizedEndLng - startLng < -180) normalizedEndLng += 360

    return normalizedEndLng
}

export function normalizeLngLatToShortestPath(startLngLat, endLngLat) {
    return {
        lng: normalizeLongitudeToShortestPath(startLngLat.lng, endLngLat.lng),
        lat: endLngLat.lat,
    }
}

export function isEndpointNormalized(startLngLat, rawEndLngLat) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(startLngLat, rawEndLngLat)

    return Math.abs(normalizedEndLngLat.lng - rawEndLngLat.lng) > 1e-6
}

export function calculateBearingAndRange(startLngLat, endLngLat) {
    const earthRadiusMeters = 6371008.8
    const normalizedEndLngLat = normalizeLngLatToShortestPath(startLngLat, endLngLat)

    const lat1 = toRadians(startLngLat.lat)
    const lat2 = toRadians(normalizedEndLngLat.lat)
    const deltaLat = toRadians(normalizedEndLngLat.lat - startLngLat.lat)
    const deltaLng = toRadians(normalizedEndLngLat.lng - startLngLat.lng)

    const haversine = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
        + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

    const distanceMeters = 2 * earthRadiusMeters * Math.atan2(
        Math.sqrt(haversine),
        Math.sqrt(1 - haversine),
    )

    const y = Math.sin(deltaLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

    return {
        bearingDegrees: normalizeBearing(toDegrees(Math.atan2(y, x))),
        rangeNauticalMiles: distanceMeters / 1852,
    }
}

export function getMidpoint(startLngLat, endLngLat) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(startLngLat, endLngLat)

    return {
        lng: (startLngLat.lng + normalizedEndLngLat.lng) / 2,
        lat: (startLngLat.lat + normalizedEndLngLat.lat) / 2,
    }
}

export function formatBearingRange(line) {
    const bearing = Math.round(line.bearingDegrees).toString().padStart(3, '0')
    const range = Math.round(line.rangeNauticalMiles).toString()

    return `${bearing}/${range}`
}

export function createBearingRangeLine(start, end, {id = crypto.randomUUID()} = {}) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(start.lngLat, end.lngLat)
    const {bearingDegrees, rangeNauticalMiles} = calculateBearingAndRange(start.lngLat, normalizedEndLngLat)

    return {
        id,
        start: start.lngLat,
        end: normalizedEndLngLat,
        rawEnd: end.lngLat,
        isEndNormalized: isEndpointNormalized(start.lngLat, end.lngLat),
        startPoint: start.point,
        endPoint: end.point,
        startMapPoint: start.mapPoint,
        endMapPoint: end.mapPoint,
        midpoint: getMidpoint(start.lngLat, normalizedEndLngLat),
        bearingDegrees,
        rangeNauticalMiles,
    }
}

export function buildLineFeature(line) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(line.start, line.end)

    return {
        type: 'Feature',
        id: line.id,
        properties: {
            id: line.id,
            opacity: 1,
        },
        geometry: {
            type: 'LineString',
            coordinates: [
                [line.start.lng, line.start.lat],
                [normalizedEndLngLat.lng, normalizedEndLngLat.lat],
            ],
        },
    }
}

export function buildFeatureCollection(lines) {
    const features = []

    lines.forEach((line) => {
        features.push(buildLineFeature(line))

        const formatted = formatBearingRange(line)
        const labelCoords = line.isPreview
            ? [line.end.lng, line.end.lat]
            : [line.midpoint.lng, line.midpoint.lat]

        features.push({
            type: 'Feature',
            id: `${line.id}-label`,
            properties: {
                id: line.id,
                label: formatted,
                isLabel: true,
                opacity: 1,
            },
            geometry: {
                type: 'Point',
                coordinates: labelCoords,
            },
        })
    })

    return {
        type: 'FeatureCollection',
        features,
    }
}

function isLongitudeVisibleInBounds(lng, west, east) {
    return lng >= west - 360 && lng <= east + 360
}

export function getLineWorldCopyOffsets(line, west, east) {
    const offsets = []

    for (let worldCopyOffset = -720; worldCopyOffset <= 720; worldCopyOffset += 360) {
        const startLng = line.start.lng + worldCopyOffset
        const endLng = line.end.lng + worldCopyOffset
        const midpointLng = line.midpoint.lng + worldCopyOffset

        if (
            isLongitudeVisibleInBounds(midpointLng, west, east)
            || isLongitudeVisibleInBounds(startLng, west, east)
            || isLongitudeVisibleInBounds(endLng, west, east)
        ) {
            offsets.push(worldCopyOffset)
        }
    }

    return offsets.length > 0 ? offsets : [0]
}

export function getLabelLongitudeCopies(midpointLng, west, east) {
    const referenceLine = {
        midpoint: {lng: midpointLng, lat: 0},
        start: {lng: midpointLng, lat: 0},
        end: {lng: midpointLng, lat: 0},
    }

    return getLineWorldCopyOffsets(referenceLine, west, east).map((offset) => midpointLng + offset)
}

export function buildCopiedLine(line, worldCopyOffset) {
    if (worldCopyOffset === 0) {
        return line
    }

    return {
        ...line,
        start: {lng: line.start.lng + worldCopyOffset, lat: line.start.lat},
        end: {lng: line.end.lng + worldCopyOffset, lat: line.end.lat},
        midpoint: {lng: line.midpoint.lng + worldCopyOffset, lat: line.midpoint.lat},
    }
}

export function getDistancePixels(startPoint, endPoint) {
    return Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y)
}
