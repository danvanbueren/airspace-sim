import {expandBounds, isPointInBounds} from './geo.js'

const DEFAULT_TRACK_SENSOR_PADDING_NM = 15
const NM_PER_LATITUDE_DEGREE = 60

export function getDisplayBounds(map, paddingDegrees = 0.5) {
    return getExpandedMapBounds(map, paddingDegrees)
}

export function getExpandedMapBounds(map, paddingDegrees = 0.5) {
    if (!map?.getBounds) {
        return null
    }

    const bounds = map.getBounds()

    return expandBounds({
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
    }, paddingDegrees)
}

/**
 * @param {Array<import('./types.js').TrackState>} tracks
 * @param {number} [paddingNm]
 * @returns {{west: number, south: number, east: number, north: number}|null}
 */
export function boundingBoxOfTracks(tracks, paddingNm = DEFAULT_TRACK_SENSOR_PADDING_NM) {
    if (!tracks?.length) {
        return null
    }

    let west = Infinity
    let east = -Infinity
    let south = Infinity
    let north = -Infinity
    let centerLat = 0
    let count = 0

    tracks.forEach((track) => {
        const lng = track.longitude ?? track.coordinates?.[0]
        const lat = track.latitude ?? track.coordinates?.[1]

        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return
        }

        west = Math.min(west, lng)
        east = Math.max(east, lng)
        south = Math.min(south, lat)
        north = Math.max(north, lat)
        centerLat += lat
        count += 1
    })

    if (!count) {
        return null
    }

    centerLat /= count

    const latPadding = paddingNm / NM_PER_LATITUDE_DEGREE
    const lngPadding = paddingNm / (
        NM_PER_LATITUDE_DEGREE * Math.max(Math.cos(centerLat * (Math.PI / 180)), 0.1)
    )

    return {
        west: west - lngPadding,
        south: south - latPadding,
        east: east + lngPadding,
        north: north + latPadding,
    }
}

/**
 * @param {{west: number, south: number, east: number, north: number}|null} left
 * @param {{west: number, south: number, east: number, north: number}|null} right
 * @returns {{west: number, south: number, east: number, north: number}|null}
 */
export function unionBounds(left, right) {
    if (!left) {
        return right
    }

    if (!right) {
        return left
    }

    return {
        west: Math.min(left.west, right.west),
        south: Math.min(left.south, right.south),
        east: Math.max(left.east, right.east),
        north: Math.max(left.north, right.north),
    }
}

/**
 * Sensor coverage is the union of the visible map area and a padded envelope around firm tracks.
 *
 * @param {{west: number, south: number, east: number, north: number}|null} displayBounds
 * @param {Array<import('./types.js').TrackState>} tracks
 * @param {number} [trackSensorPaddingNm]
 * @returns {{west: number, south: number, east: number, north: number}|null}
 */
export function computeSensorScanBounds(
    displayBounds,
    tracks,
    trackSensorPaddingNm = DEFAULT_TRACK_SENSOR_PADDING_NM,
) {
    return unionBounds(
        displayBounds,
        boundingBoxOfTracks(tracks, trackSensorPaddingNm),
    )
}

export function getSensorScanAircraft(
    flightWorld,
    sensorScanBounds,
    viewportBasedTrackDroppingEnabled = false,
) {
    if (!flightWorld) {
        return []
    }

    if (viewportBasedTrackDroppingEnabled !== true) {
        return flightWorld.getAllAircraft()
    }

    return flightWorld.getAircraftInBounds(sensorScanBounds)
}

export function filterDetectionsByBounds(detections, bounds) {
    if (!bounds || !detections?.length) {
        return detections ?? []
    }

    return detections.filter((detection) => {
        const lng = detection.longitude
        const lat = detection.latitude

        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return false
        }

        return isPointInBounds(lng, lat, bounds)
    })
}

export function filterTracksByBounds(tracks, bounds) {
    if (!bounds || !tracks?.length) {
        return tracks ?? []
    }

    return tracks.filter((track) => {
        const lng = track.longitude ?? track.coordinates?.[0]
        const lat = track.latitude ?? track.coordinates?.[1]

        if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
            return false
        }

        return isPointInBounds(lng, lat, bounds)
    })
}

/** Shared zoom scale for track icons and sensor tick marks on the scope. */
export function getTrackIconScaleForZoom(zoom) {
    const minZoom = 4
    const maxZoom = 10
    const minScale = 0.35
    const maxScale = 1

    if (!Number.isFinite(zoom)) {
        return maxScale
    }

    if (zoom <= minZoom) {
        return minScale
    }

    if (zoom >= maxZoom) {
        return maxScale
    }

    const t = (zoom - minZoom) / (maxZoom - minZoom)

    return minScale + (maxScale - minScale) * t
}
