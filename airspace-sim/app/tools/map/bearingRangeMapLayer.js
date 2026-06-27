import {
    buildFeatureCollection,
} from './bearingRangeGeometry.js'

export const BEARING_RANGE_SOURCE_ID = 'bearing-range-lines-source'
export const BEARING_RANGE_LAYER_ID = 'bearing-range-lines-layer'

const EMPTY_FEATURE_COLLECTION = {type: 'FeatureCollection', features: []}

function getLinePaint(lineColor) {
    return {
        'line-color': lineColor,
        'line-width': 4,
        'line-opacity': ['get', 'opacity'],
    }
}

function getLineLayout() {
    return {
        'line-cap': 'round',
        'line-join': 'round',
    }
}

function moveLayerToTop(map) {
    if (map.getLayer(BEARING_RANGE_LAYER_ID)) {
        map.moveLayer(BEARING_RANGE_LAYER_ID)
    }
}

async function waitForStyleReady(map) {
    if (map.isStyleLoaded()) {
        return
    }

    await new Promise((resolve) => {
        if (map.isStyleLoaded()) {
            resolve()
            return
        }

        map.once('idle', resolve)
    })
}

export function ensureBearingRangeLayer(map, lineColor, appliedLineColorRef) {
    if (!map.getSource(BEARING_RANGE_SOURCE_ID)) {
        map.addSource(BEARING_RANGE_SOURCE_ID, {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION,
            lineMetrics: true,
            generateId: true,
        })
    }

    if (!map.getLayer(BEARING_RANGE_LAYER_ID)) {
        map.addLayer({
            id: BEARING_RANGE_LAYER_ID,
            type: 'line',
            source: BEARING_RANGE_SOURCE_ID,
            paint: getLinePaint(lineColor),
            layout: getLineLayout(),
        })
        moveLayerToTop(map)
    }

    if (appliedLineColorRef.current !== lineColor) {
        map.setPaintProperty(BEARING_RANGE_LAYER_ID, 'line-color', lineColor)
        appliedLineColorRef.current = lineColor
    }
}

export function setBearingRangeLines(map, lines, lineColor, appliedLineColorRef) {
    if (!map) {
        return false
    }

    const featureCollection = buildFeatureCollection(lines)
    const existingSource = map.getSource(BEARING_RANGE_SOURCE_ID)

    if (existingSource) {
        existingSource.setData(featureCollection)

        if (appliedLineColorRef.current !== lineColor && map.getLayer(BEARING_RANGE_LAYER_ID)) {
            map.setPaintProperty(BEARING_RANGE_LAYER_ID, 'line-color', lineColor)
            appliedLineColorRef.current = lineColor
        }

        moveLayerToTop(map)
        map.triggerRepaint()
        return true
    }

    if (!map.isStyleLoaded()) {
        return false
    }

    ensureBearingRangeLayer(map, lineColor, appliedLineColorRef)

    const source = map.getSource(BEARING_RANGE_SOURCE_ID)

    if (!source) {
        return false
    }

    source.setData(featureCollection)
    moveLayerToTop(map)
    map.triggerRepaint()

    return true
}

export async function rehydrateBearingRangeLines(map, lines, lineColor, appliedLineColorRef) {
    if (!map) {
        return false
    }

    await waitForStyleReady(map)
    appliedLineColorRef.current = null

    return setBearingRangeLines(map, lines, lineColor, appliedLineColorRef)
}

export function getBearingRangeLineAtMapPoint(map, mapPoint, lines) {
    if (!map.getLayer(BEARING_RANGE_LAYER_ID)) {
        return null
    }

    const features = map.queryRenderedFeatures([
        [mapPoint.x - 6, mapPoint.y - 6],
        [mapPoint.x + 6, mapPoint.y + 6],
    ], {
        layers: [BEARING_RANGE_LAYER_ID],
    })

    const lineId = features[0]?.properties?.id

    if (!lineId) {
        return null
    }

    return lines.find((line) => line.id === lineId) ?? null
}
