import {offsetLngLat} from './geo'
import {getTrackIconScaleForZoom} from './mapViewportUtils'
import {isReferencePoint} from './trackKinds.js'

/** Screen-space offset from track center to clear familiar icon symbology. */
const BASE_START_OFFSET_PIXELS = 16

/** At speed 0 the stick collapses to a dot at the heading offset. */
const BASE_DOT_LENGTH_PIXELS = 1.5
const BASE_MAX_LENGTH_PIXELS = 48
const REFERENCE_SPEED_KNOTS = 500

function startOffsetPixels(zoom) {
    return BASE_START_OFFSET_PIXELS * getTrackIconScaleForZoom(zoom)
}

export function trackVectorLengthPixels(speed, zoom) {
    const scale = getTrackIconScaleForZoom(zoom)
    const speedKnots = Number.isFinite(speed) ? Math.max(0, speed) : 0
    const dotLength = BASE_DOT_LENGTH_PIXELS * scale
    const maxLength = BASE_MAX_LENGTH_PIXELS * scale

    if (speedKnots <= 0) {
        return dotLength
    }

    const speedRatio = Math.min(1, speedKnots / REFERENCE_SPEED_KNOTS)

    return dotLength + speedRatio * (maxLength - dotLength)
}

function headingScreenDelta(headingDegrees, lengthPixels) {
    const radians = headingDegrees * (Math.PI / 180)

    return {
        dx: Math.sin(radians) * lengthPixels,
        dy: -Math.cos(radians) * lengthPixels,
    }
}

function lineCoordinatesFromMap(map, longitude, latitude, headingDegrees, speed) {
    const zoom = map.getZoom()
    const center = map.project([longitude, latitude])
    const startOffset = startOffsetPixels(zoom)
    const vectorLength = trackVectorLengthPixels(speed, zoom)
    const startDelta = headingScreenDelta(headingDegrees, startOffset)
    const vectorDelta = headingScreenDelta(headingDegrees, vectorLength)

    const startPixel = {
        x: center.x + startDelta.dx,
        y: center.y + startDelta.dy,
    }
    const endPixel = {
        x: startPixel.x + vectorDelta.dx,
        y: startPixel.y + vectorDelta.dy,
    }

    const start = map.unproject(startPixel)
    const end = map.unproject(endPixel)

    return [
        [start.lng, start.lat],
        [end.lng, end.lat],
    ]
}

function lineCoordinatesFromGround(longitude, latitude, headingDegrees, speed, zoom) {
    const startOffsetNm = startOffsetPixels(zoom) / 1200
    const vectorLengthNm = trackVectorLengthPixels(speed, zoom) / 1200
    const start = offsetLngLat(longitude, latitude, headingDegrees, startOffsetNm)
    const end = offsetLngLat(start.lng, start.lat, headingDegrees, vectorLengthNm)

    return [
        [start.lng, start.lat],
        [end.lng, end.lat],
    ]
}

export function trackVectorLineCoordinates(map, longitude, latitude, headingDegrees, speed) {
    const zoom = map?.getZoom?.()

    if (!Number.isFinite(headingDegrees)) {
        return null
    }

    const speedKnots = Number.isFinite(speed) ? Math.max(0, speed) : 0

    if (map?.project && map?.unproject) {
        return lineCoordinatesFromMap(map, longitude, latitude, headingDegrees, speedKnots)
    }

    return lineCoordinatesFromGround(longitude, latitude, headingDegrees, speedKnots, zoom)
}

export function trackToVectorFeature(track, map) {
    const longitude = track.longitude ?? track.coordinates?.[0] ?? track.lng
    const latitude = track.latitude ?? track.coordinates?.[1] ?? track.lat
    const heading = Number(track.heading)
    const speed = Number(track.speed)
    const id = track.id ?? track.trackId ?? track.mtiId

    if (!id || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return null
    }

    const coordinates = trackVectorLineCoordinates(map, longitude, latitude, heading, speed)

    if (!coordinates) {
        return null
    }

    return {
        type: 'Feature',
        id: `${id}-vector`,
        geometry: {
            type: 'LineString',
            coordinates,
        },
        properties: {
            trackId: id,
            stale: isReferencePoint(track) ? false : Boolean(track.stale),
        },
    }
}

export function tracksToVectorFeatureCollection(tracks, map) {
    const features = []

    tracks.forEach((track) => {
        const feature = trackToVectorFeature(track, map)

        if (feature) {
            features.push(feature)
        }
    })

    return {
        type: 'FeatureCollection',
        features,
    }
}
