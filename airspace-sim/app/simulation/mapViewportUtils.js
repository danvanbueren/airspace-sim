import {expandBounds, isPointInBounds} from './geo'

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
