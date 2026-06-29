const EARTH_RADIUS_NM = 3440.065

export function bearingDegrees(lat1, lng1, lat2, lng2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180)
    const toDegrees = (radians) => radians * (180 / Math.PI)
    const lat1Radians = toRadians(lat1)
    const lat2Radians = toRadians(lat2)
    const deltaLngRadians = toRadians(lng2 - lng1)
    const y = Math.sin(deltaLngRadians) * Math.cos(lat2Radians)
    const x = (
        Math.cos(lat1Radians) * Math.sin(lat2Radians)
        - Math.sin(lat1Radians) * Math.cos(lat2Radians) * Math.cos(deltaLngRadians)
    )

    return (toDegrees(Math.atan2(y, x)) + 360) % 360
}

export function haversineDistanceNm(lat1, lng1, lat2, lng2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180)
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2

    return 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a))
}

export function offsetLngLat(lng, lat, bearingDegrees, distanceNm) {
    const bearing = bearingDegrees * (Math.PI / 180)
    const distanceRadians = distanceNm / EARTH_RADIUS_NM
    const latRadians = lat * (Math.PI / 180)
    const lngRadians = lng * (Math.PI / 180)

    const nextLatRadians = Math.asin(
        Math.sin(latRadians) * Math.cos(distanceRadians)
        + Math.cos(latRadians) * Math.sin(distanceRadians) * Math.cos(bearing),
    )
    const nextLngRadians = lngRadians + Math.atan2(
        Math.sin(bearing) * Math.sin(distanceRadians) * Math.cos(latRadians),
        Math.cos(distanceRadians) - Math.sin(latRadians) * Math.sin(nextLatRadians),
    )

    return {
        lng: nextLngRadians * (180 / Math.PI),
        lat: nextLatRadians * (180 / Math.PI),
    }
}

export function extrapolatePosition(lng, lat, headingDegrees, speedKnots, deltaSeconds) {
    const distanceNm = (speedKnots * deltaSeconds) / 3600

    if (!Number.isFinite(distanceNm) || distanceNm <= 0) {
        return {lng, lat}
    }

    return offsetLngLat(lng, lat, headingDegrees, distanceNm)
}

export function isLongitudeInBounds(lng, west, east) {
    if (!Number.isFinite(lng) || !Number.isFinite(west) || !Number.isFinite(east)) {
        return false
    }

    let normalizedEast = east

    while (normalizedEast < west) {
        normalizedEast += 360
    }

    if (normalizedEast - west >= 360) {
        return true
    }

    const worldOffset = Math.floor((west - lng) / 360)
    const normalizedLng = lng + (worldOffset * 360)

    return [normalizedLng, normalizedLng + 360].some((candidate) => (
        candidate >= west && candidate <= normalizedEast
    ))
}

export function isPointInBounds(lng, lat, bounds) {
    if (!bounds) {
        return true
    }

    const {west, south, east, north} = bounds

    if (!isLongitudeInBounds(lng, west, east)) {
        return false
    }

    if (lat < south || lat > north) {
        return false
    }

    return true
}

export function expandBounds(bounds, paddingDegrees) {
    if (!bounds) {
        return null
    }

    return {
        west: bounds.west - paddingDegrees,
        south: bounds.south - paddingDegrees,
        east: bounds.east + paddingDegrees,
        north: bounds.north + paddingDegrees,
    }
}
