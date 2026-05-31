import {SENSOR_COLORS, SENSOR_TYPES} from './constants'
import {offsetLngLat} from './geo'

/** Screen-space half-length so lines look the same at all latitudes on Web Mercator. */
const LINE_HALF_LENGTH_PIXELS = 14

/** Fallback ground distance when map projection is unavailable. */
const LINE_HALF_LENGTH_NM = 0.25

function isVerticalOrientation(detection, sensorType) {
    if (sensorType === SENSOR_TYPES.RADAR) {
        return !detection.correlated
    }

    return Boolean(detection.correlated)
}

function lineCoordinatesFromMap(map, longitude, latitude, vertical) {
    const center = map.project([longitude, latitude])
    const halfLength = LINE_HALF_LENGTH_PIXELS

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

function lineCoordinatesFromGround(longitude, latitude, vertical) {
    if (vertical) {
        const north = offsetLngLat(longitude, latitude, 0, LINE_HALF_LENGTH_NM)
        const south = offsetLngLat(longitude, latitude, 180, LINE_HALF_LENGTH_NM)

        return [
            [longitude, south.lat],
            [longitude, north.lat],
        ]
    }

    const east = offsetLngLat(longitude, latitude, 90, LINE_HALF_LENGTH_NM)
    const west = offsetLngLat(longitude, latitude, 270, LINE_HALF_LENGTH_NM)

    return [
        [west.lng, latitude],
        [east.lng, latitude],
    ]
}

export function detectionLineCoordinates(map, longitude, latitude, vertical) {
    if (map?.project && map?.unproject) {
        return lineCoordinatesFromMap(map, longitude, latitude, vertical)
    }

    return lineCoordinatesFromGround(longitude, latitude, vertical)
}

export function detectionToLineFeature(detection, sensorType, layerKind, map) {
    const vertical = isVerticalOrientation(detection, sensorType)
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
