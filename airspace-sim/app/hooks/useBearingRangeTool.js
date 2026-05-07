import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

const RIGHT_MOUSE_BUTTON = 2
const CONTEXT_MENU_MAX_MS = 250
const CONTEXT_MENU_MAX_PIXELS = 6
const MIN_PERSISTED_LINE_PIXELS = 24
const LINE_SOURCE_ID = 'bearing-range-lines-source'
const LINE_LAYER_ID = 'bearing-range-lines-layer'
const PREVIEW_LINE_SOURCE_ID = 'bearing-range-preview-line-source'
const PREVIEW_LINE_LAYER_ID = 'bearing-range-preview-line-layer'
const DEFAULT_MAP_CURSOR = 'crosshair'
const BEARING_RANGE_CONTEXT_MENU_CURSOR = 'context-menu'

function toRadians(value) {
    return value * Math.PI / 180
}

function toDegrees(value) {
    return value * 180 / Math.PI
}

function normalizeBearing(value) {
    return (value + 360) % 360
}

function normalizeLongitudeToShortestPath(startLng, endLng) {
    let normalizedEndLng = endLng

    while (normalizedEndLng - startLng > 180) {
        normalizedEndLng -= 360
    }

    while (normalizedEndLng - startLng < -180) {
        normalizedEndLng += 360
    }

    return normalizedEndLng
}

function normalizeLngLatToShortestPath(startLngLat, endLngLat) {
    return {
        lng: normalizeLongitudeToShortestPath(startLngLat.lng, endLngLat.lng),
        lat: endLngLat.lat,
    }
}

function calculateBearingAndRange(startLngLat, endLngLat) {
    const earthRadiusMeters = 6371008.8
    const normalizedEndLngLat = normalizeLngLatToShortestPath(startLngLat, endLngLat)

    const lat1 = toRadians(startLngLat.lat)
    const lat2 = toRadians(normalizedEndLngLat.lat)
    const deltaLat = toRadians(normalizedEndLngLat.lat - startLngLat.lat)
    const deltaLng = toRadians(normalizedEndLngLat.lng - startLngLat.lng)

    const haversine =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

    const distanceMeters = 2 * earthRadiusMeters * Math.atan2(
        Math.sqrt(haversine),
        Math.sqrt(1 - haversine),
    )

    const y = Math.sin(deltaLng) * Math.cos(lat2)
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

    const bearingDegrees = normalizeBearing(toDegrees(Math.atan2(y, x)))
    const rangeNauticalMiles = distanceMeters / 1852

    return {
        bearingDegrees,
        rangeNauticalMiles,
    }
}

function getMidpoint(startLngLat, endLngLat) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(startLngLat, endLngLat)

    return {
        lng: (startLngLat.lng + normalizedEndLngLat.lng) / 2,
        lat: (startLngLat.lat + normalizedEndLngLat.lat) / 2,
    }
}

function formatBearingRange(line) {
    const bearing = Math.round(line.bearingDegrees).toString().padStart(3, '0')
    const range = Math.round(line.rangeNauticalMiles).toString()

    return `${bearing}/${range}`
}

function buildLineFeature(line) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(line.start, line.end)

    return {
        type: 'Feature',
        properties: {
            id: line.id,
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

function buildFeatureCollection(lines) {
    return {
        type: 'FeatureCollection',
        features: lines.map(buildLineFeature),
    }
}

function ensureLineLayer(map, sourceId, layerId, lineOpacity = 1, lineColor = '#fff') {
    if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
            type: 'geojson',
            data: buildFeatureCollection([]),
        })
    }

    if (!map.getLayer(layerId)) {
        map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            paint: {
                'line-color': lineColor,
                'line-width': 4,
                'line-opacity': lineOpacity,
            },
            layout: {
                'line-cap': 'round',
                'line-join': 'round',
            },
        })
        return
    }

    map.setPaintProperty(layerId, 'line-color', lineColor)
    map.setPaintProperty(layerId, 'line-opacity', lineOpacity)
}

function updateLineSource(map, sourceId, lines) {
    const source = map.getSource(sourceId)

    if (source)
        source.setData(buildFeatureCollection(lines))
}

function runWhenStyleIsReady(map, callback) {
    if (map.isStyleLoaded()) {
        callback()
        return undefined
    }

    const handleStyleLoaded = () => {
        if (!map.isStyleLoaded())
            return

        map.off('styledata', handleStyleLoaded)
        callback()
    }

    map.on('styledata', handleStyleLoaded)

    return () => {
        map.off('styledata', handleStyleLoaded)
    }
}

function createLabelElement(line) {
    const element = document.createElement('div')

    element.style.padding = '6px 8px'
    element.style.borderRadius = '4px'
    element.style.background = 'rgba(0, 0, 0, 0.75)'
    element.style.color = '#fff'
    element.style.fontSize = '12px'
    element.style.fontFamily = 'monospace'
    element.style.pointerEvents = 'none'
    element.style.whiteSpace = 'pre'

    element.textContent = formatBearingRange(line)

    return element
}

function getLabelLongitudeCopies(map, midpointLng) {
    const bounds = map.getBounds()
    const west = bounds.getWest()
    const east = bounds.getEast()
    const copies = []

    for (let lng = midpointLng - 720; lng <= midpointLng + 720; lng += 360) {
        if (lng >= west - 360 && lng <= east + 360) {
            copies.push(lng)
        }
    }

    return copies.length > 0 ? copies : [midpointLng]
}

function createLineFromDrag(start, end, isPreview = false) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(start.lngLat, end.lngLat)
    const { bearingDegrees, rangeNauticalMiles } = calculateBearingAndRange(start.lngLat, normalizedEndLngLat)

    return {
        id: isPreview ? 'bearing-range-preview-line' : crypto.randomUUID(),
        start: start.lngLat,
        end: normalizedEndLngLat,
        startPoint: start.point,
        endPoint: end.point,
        midpoint: getMidpoint(start.lngLat, normalizedEndLngLat),
        bearingDegrees,
        rangeNauticalMiles,
        isPreview,
    }
}

export function useBearingRangeTool(
    mapRef,
    enabled,
    {
        onContextMenu,
        lineColor = '#fff',
    } = {}
) {
    const labelsRef = useRef([])
    const dragStartRef = useRef(null)
    const [lines, setLines] = useState([])
    const [previewLine, setPreviewLine] = useState(null)
    const [labelWorldVersion, setLabelWorldVersion] = useState(0)

    const visibleLabelLines = useMemo(() => {
        return previewLine ? [...lines, previewLine] : lines
    }, [lines, previewLine])

    useEffect(() => {
        if (!enabled || !mapRef.current)
            return

        const map = mapRef.current

        const refreshLabels = () => {
            setLabelWorldVersion((currentVersion) => currentVersion + 1)
        }

        map.on('moveend', refreshLabels)
        map.on('zoomend', refreshLabels)

        return () => {
            map.off('moveend', refreshLabels)
            map.off('zoomend', refreshLabels)
        }
    }, [mapRef, enabled])

    useEffect(() => {
        if (!enabled || !mapRef.current)
            return

        const map = mapRef.current

        return runWhenStyleIsReady(map, () => {
            ensureLineLayer(map, LINE_SOURCE_ID, LINE_LAYER_ID, 1, lineColor)
            ensureLineLayer(map, PREVIEW_LINE_SOURCE_ID, PREVIEW_LINE_LAYER_ID, 0.5, lineColor)

            updateLineSource(map, LINE_SOURCE_ID, lines)
            updateLineSource(map, PREVIEW_LINE_SOURCE_ID, previewLine ? [previewLine] : [])
        })
    }, [mapRef, enabled, lines, previewLine, lineColor])

    useEffect(() => {
        if (!enabled || !mapRef.current)
            return

        const map = mapRef.current

        labelsRef.current.forEach((marker) => marker.remove())
        labelsRef.current = []

        visibleLabelLines.forEach((line) => {
            const isMoreVertical = Math.abs(line.endPoint.y - line.startPoint.y) > Math.abs(line.endPoint.x - line.startPoint.x)
            const labelLongitudes = getLabelLongitudeCopies(map, line.midpoint.lng)

            labelLongitudes.forEach((lng) => {
                const element = createLabelElement(line)

                if (line.isPreview) {
                    element.style.opacity = '0.5'
                }

                const marker = new maplibregl.Marker({
                    element,
                    anchor: isMoreVertical ? 'left' : 'bottom',
                    offset: isMoreVertical ? [14, 0] : [0, -12],
                })
                    .setLngLat({
                        lng,
                        lat: line.midpoint.lat,
                    })
                    .addTo(map)

                labelsRef.current.push(marker)
            })
        })

        return () => {
            labelsRef.current.forEach((marker) => marker.remove())
            labelsRef.current = []
        }
    }, [mapRef, enabled, visibleLabelLines, labelWorldVersion])

    useEffect(() => {
        if (!enabled || !mapRef.current)
            return

        const map = mapRef.current
        const canvas = map.getCanvas()

        const getDragPoint = (event) => ({
            point: {
                x: event.clientX,
                y: event.clientY,
            },
            mapPoint: {
                x: event.offsetX,
                y: event.offsetY,
            },
            lngLat: map.unproject([event.offsetX, event.offsetY]),
        })

        const getBearingRangeLineAtPoint = (point) => {
            if (!map.getLayer(LINE_LAYER_ID))
                return null

            const features = map.queryRenderedFeatures(
                [
                    [point.mapPoint.x - 6, point.mapPoint.y - 6],
                    [point.mapPoint.x + 6, point.mapPoint.y + 6],
                ],
                {
                    layers: [LINE_LAYER_ID],
                },
            )

            const lineId = features[0]?.properties?.id

            if (!lineId)
                return null

            return lines.find((line) => line.id === lineId) ?? null
        }

        const updateBearingRangeCursor = (event) => {
            if (dragStartRef.current || event.buttons !== 0)
                return

            const hoveredLine = getBearingRangeLineAtPoint(getDragPoint(event))

            canvas.style.cursor = hoveredLine
                ? BEARING_RANGE_CONTEXT_MENU_CURSOR
                : DEFAULT_MAP_CURSOR
        }

        const handleMouseDown = (event) => {
            if (event.button !== RIGHT_MOUSE_BUTTON)
                return

            event.preventDefault()

            dragStartRef.current = {
                time: performance.now(),
                ...getDragPoint(event),
            }

            setPreviewLine(null)
        }

        const handleMouseMove = (event) => {
            if (!dragStartRef.current) {
                updateBearingRangeCursor(event)
                return
            }

            event.preventDefault()

            const dragStart = dragStartRef.current
            const currentDragPoint = getDragPoint(event)
            const deltaPixels = Math.hypot(
                currentDragPoint.point.x - dragStart.point.x,
                currentDragPoint.point.y - dragStart.point.y,
            )

            if (deltaPixels <= CONTEXT_MENU_MAX_PIXELS) {
                setPreviewLine(null)
                return
            }

            setPreviewLine(createLineFromDrag(dragStart, currentDragPoint, true))
        }

        const handleMouseUp = (event) => {
            if (event.button !== RIGHT_MOUSE_BUTTON || !dragStartRef.current)
                return

            event.preventDefault()

            const dragStart = dragStartRef.current
            const endDragPoint = getDragPoint(event)

            dragStartRef.current = null
            setPreviewLine(null)

            const deltaTime = performance.now() - dragStart.time
            const deltaPixels = Math.hypot(
                endDragPoint.point.x - dragStart.point.x,
                endDragPoint.point.y - dragStart.point.y,
            )

            const shouldOpenContextMenu =
                deltaTime <= CONTEXT_MENU_MAX_MS &&
                deltaPixels <= CONTEXT_MENU_MAX_PIXELS

            if (shouldOpenContextMenu) {
                onContextMenu?.({
                    point: endDragPoint.point,
                    lngLat: endDragPoint.lngLat,
                    line: getBearingRangeLineAtPoint(endDragPoint),
                })

                return
            }

            if (deltaPixels < MIN_PERSISTED_LINE_PIXELS)
                return

            const newLine = createLineFromDrag(dragStart, endDragPoint)

            setLines((currentLines) => [
                ...currentLines,
                newLine,
            ])
        }

        const handleContextMenu = (event) => {
            event.preventDefault()
        }

        const handleMouseLeave = () => {
            canvas.style.cursor = DEFAULT_MAP_CURSOR
        }

        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('mouseleave', handleMouseLeave)
        canvas.addEventListener('contextmenu', handleContextMenu)

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown)
            canvas.removeEventListener('mousemove', handleMouseMove)
            canvas.removeEventListener('mouseup', handleMouseUp)
            canvas.removeEventListener('mouseleave', handleMouseLeave)
            canvas.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [mapRef, enabled, onContextMenu, lines])

    return {
        lines,
        removeBearingRangeLine: (lineId) => {
            setLines((currentLines) => currentLines.filter((line) => line.id !== lineId))
            setPreviewLine(null)
        },
        clearBearingRangeLines: () => {
            setLines([])
            setPreviewLine(null)
        },
    }
}