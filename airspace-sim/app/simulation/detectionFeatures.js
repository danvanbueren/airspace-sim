import {SENSOR_COLORS, SENSOR_TYPES} from './constants'
import {offsetLngLat} from './geo'
import {getTrackIconScaleForZoom} from '../tools/map/mapViewportUtils.js'

/** Screen-space half-length at reference zoom (matches track icon baseline near z10). */
const BASE_LINE_HALF_LENGTH_PIXELS = 14

/** Fallback ground distance when map projection is unavailable. */
const BASE_LINE_HALF_LENGTH_NM = 0.25

function lineHalfLengthPixels(zoom) {
    return BASE_LINE_HALF_LENGTH_PIXELS * getTrackIconScaleForZoom(zoom)
}

function lineHalfLengthNm(zoom) {
    return BASE_LINE_HALF_LENGTH_NM * getTrackIconScaleForZoom(zoom)
}

function isVerticalOrientation(detection) {
    return Boolean(detection.correlated)
}

function lineCoordinatesFromMap(map, longitude, latitude, vertical) {
    const center = map.project([longitude, latitude])
    const halfLength = lineHalfLengthPixels(map.getZoom())

    const startPixel = vertical
        ? {x: center.x, y: center.y - halfLength}
        : {x: center.x - halfLength, y: center.y}
    const endPixel = vertical
        ? {x: center.x, y: center.y + halfLength}
        : {x: center.x + halfLength, y: center.y}

    const start = map.unproject(startPixel)
    const end = map.unproject(endPixel)

    return [
        [start.lng, start.lat],
        [end.lng, end.lat],
    ]
}

function lineCoordinatesFromGround(longitude, latitude, vertical, zoom) {
    const halfLengthNm = lineHalfLengthNm(zoom)

    if (vertical) {
        const north = offsetLngLat(longitude, latitude, 0, halfLengthNm)
        const south = offsetLngLat(longitude, latitude, 180, halfLengthNm)

        return [
            [longitude, south.lat],
            [longitude, north.lat],
        ]
    }

    const east = offsetLngLat(longitude, latitude, 90, halfLengthNm)
    const west = offsetLngLat(longitude, latitude, 270, halfLengthNm)

    return [
        [west.lng, latitude],
        [east.lng, latitude],
    ]
}

export function detectionLineCoordinates(map, longitude, latitude, vertical) {
    const zoom = map?.getZoom?.()

    if (map?.project && map?.unproject) {
        return lineCoordinatesFromMap(map, longitude, latitude, vertical)
    }

    return lineCoordinatesFromGround(longitude, latitude, vertical, zoom)
}

export function detectionToLineFeature(detection, sensorType, layerKind, map) {
    const vertical = isVerticalOrientation(detection)
    const {longitude, latitude} = detection
    const coordinates = detectionLineCoordinates(map, longitude, latitude, vertical)

    return {
        type: 'Feature',
        id: `${layerKind}-${detection.id}`,
        geometry: {
            type: 'LineString',
            coordinates,
        },
        properties: {
            id: detection.id,
            sensorType,
            layerKind,
            correlated: Boolean(detection.correlated),
            color: SENSOR_COLORS[sensorType],
        },
    }
}

export function detectionsToFeatureCollection(detections, sensorType, layerKind, map) {
    const features = detections.map((detection) => (
        detectionToLineFeature(detection, sensorType, layerKind, map)
    ))

    return {
        type: 'FeatureCollection',
        features,
    }
}
