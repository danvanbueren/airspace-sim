import {buildGeometryFeatureCollection} from './drawGeometryGeometry.js'

export const DRAW_GEOMETRY_SOURCE_ID = 'draw-geometry-source'
export const DRAW_GEOMETRY_FILL_LAYER_ID = 'draw-geometry-fill-layer'
export const DRAW_GEOMETRY_LINE_LAYER_ID = 'draw-geometry-line-layer'
export const DRAW_GEOMETRY_LABEL_LAYER_ID = 'draw-geometry-label-layer'

const EMPTY_FEATURE_COLLECTION = {type: 'FeatureCollection', features: []}

function moveLayersToTop(map) {
    for (const layerId of [
        DRAW_GEOMETRY_FILL_LAYER_ID,
        DRAW_GEOMETRY_LINE_LAYER_ID,
        DRAW_GEOMETRY_LABEL_LAYER_ID,
    ]) {
        if (map.getLayer(layerId)) {
            map.moveLayer(layerId)
        }
    }
}

function getFillPaint() {
    return {
        'fill-color': ['get', 'fillColor'],
        'fill-opacity': ['*', ['get', 'fillOpacity'], ['get', 'opacity']],
        'fill-outline-color': ['get', 'strokeColor'],
    }
}

function getLinePaint() {
    return {
        'line-color': ['get', 'strokeColor'],
        'line-width': 2,
        'line-opacity': ['get', 'opacity'],
    }
}

function getLabelPaint() {
    return {
        'text-color': ['get', 'textColor'],
        'text-halo-color': ['get', 'textHaloColor'],
        'text-halo-width': 1,
    }
}

function getLabelLayout() {
    return {
        'text-field': ['get', 'label'],
        'text-font': ['monospace'],
        'text-size': 12,
        'text-offset': [0, -1.6],
        'text-anchor': 'bottom',
        'text-allow-overlap': true,
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

export function ensureDrawGeometryLayers(
    map,
    appliedColorsRef,
) {
    if (!map.getSource(DRAW_GEOMETRY_SOURCE_ID)) {
        map.addSource(DRAW_GEOMETRY_SOURCE_ID, {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION,
            generateId: true,
        })
    }

    if (!map.getLayer(DRAW_GEOMETRY_FILL_LAYER_ID)) {
        map.addLayer({
            id: DRAW_GEOMETRY_FILL_LAYER_ID,
            type: 'fill',
            source: DRAW_GEOMETRY_SOURCE_ID,
            filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['>', ['get', 'fillOpacity'], 0]],
            paint: getFillPaint(),
        })
    }

    if (!map.getLayer(DRAW_GEOMETRY_LINE_LAYER_ID)) {
        map.addLayer({
            id: DRAW_GEOMETRY_LINE_LAYER_ID,
            type: 'line',
            source: DRAW_GEOMETRY_SOURCE_ID,
            filter: ['any',
                ['==', ['geometry-type'], 'LineString'],
                ['==', ['geometry-type'], 'Polygon'],
            ],
            paint: getLinePaint(),
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
        })
    }

    if (!map.getLayer(DRAW_GEOMETRY_LABEL_LAYER_ID)) {
        map.addLayer({
            id: DRAW_GEOMETRY_LABEL_LAYER_ID,
            type: 'symbol',
            source: DRAW_GEOMETRY_SOURCE_ID,
            filter: ['all', ['==', ['geometry-type'], 'Point'], ['has', 'label']],
            paint: getLabelPaint(),
            layout: getLabelLayout(),
        })
    }

    moveLayersToTop(map)
}

function buildRenderableFeatureCollection(shapes, defaultStrokeColor, defaultFillColor, textHaloColor, themeMode) {
    const featureCollection = buildGeometryFeatureCollection(shapes)

    return {
        ...featureCollection,
        features: featureCollection.features.map((feature) => {
            const shapeId = feature.properties.shapeId ?? feature.properties.id
            const shape = shapes.find((entry) => entry.id === shapeId)
            const strokeColor = shape?.strokeColorsByMode?.[themeMode] ?? defaultStrokeColor
            const fillColor = shape?.fillColorsByMode?.[themeMode] ?? defaultFillColor

            if (feature.geometry.type === 'Point') {
                return {
                    ...feature,
                    properties: {
                        ...feature.properties,
                        textColor: strokeColor,
                        textHaloColor,
                    },
                }
            }

            return {
                ...feature,
                properties: {
                    ...feature.properties,
                    fillOpacity: shape?.fillOpacity ?? 0,
                    strokeColor,
                    fillColor,
                },
            }
        }),
    }
}

export function setDrawGeometryShapes(
    map,
    shapes,
    strokeColor,
    fillColor,
    textHaloColor,
    themeMode,
    appliedColorsRef,
) {
    if (!map) {
        return false
    }

    const featureCollection = buildRenderableFeatureCollection(shapes, strokeColor, fillColor, textHaloColor, themeMode)
    const existingSource = map.getSource(DRAW_GEOMETRY_SOURCE_ID)

    if (existingSource) {
        existingSource.setData(featureCollection)
        ensureDrawGeometryLayers(map, appliedColorsRef)
        map.triggerRepaint()
        return true
    }

    if (!map.isStyleLoaded()) {
        return false
    }

    ensureDrawGeometryLayers(map, appliedColorsRef)

    const source = map.getSource(DRAW_GEOMETRY_SOURCE_ID)

    if (!source) {
        return false
    }

    source.setData(featureCollection)
    moveLayersToTop(map)
    map.triggerRepaint()

    return true
}

export async function rehydrateDrawGeometryShapes(
    map,
    shapes,
    strokeColor,
    fillColor,
    textHaloColor,
    themeMode,
    appliedColorsRef,
) {
    if (!map) {
        return false
    }

    await waitForStyleReady(map)
    if (appliedColorsRef) {
        appliedColorsRef.current = null
    }

    return setDrawGeometryShapes(
        map,
        shapes,
        strokeColor,
        fillColor,
        textHaloColor,
        themeMode,
        appliedColorsRef,
    )
}

export function getDrawGeometryShapeAtMapPoint(map, mapPoint, shapes, pixelRadius = 8) {
    if (!map) {
        return null
    }

    const layerIds = [
        DRAW_GEOMETRY_FILL_LAYER_ID,
        DRAW_GEOMETRY_LINE_LAYER_ID,
    ].filter((layerId) => map.getLayer(layerId))

    if (layerIds.length === 0) {
        return null
    }

    const features = map.queryRenderedFeatures([
        [mapPoint.x - pixelRadius, mapPoint.y - pixelRadius],
        [mapPoint.x + pixelRadius, mapPoint.y + pixelRadius],
    ], {
        layers: layerIds,
    })

    const shapeId = features[0]?.properties?.id

    if (!shapeId) {
        return null
    }

    return shapes.find((shape) => shape.id === shapeId) ?? null
}
