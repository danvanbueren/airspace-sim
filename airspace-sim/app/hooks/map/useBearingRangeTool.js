import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import maplibregl from 'maplibre-gl'
import {
    getMouseEventButton,
    getMouseEventButtons,
    mouseButtonMatchesBinding,
    pressedMouseButtonsMatchBinding,
    useControlBindings,
} from '../../contexts/ControlBindingsContext'

const LINE_SOURCE_ID = 'bearing-range-lines-source'
const LINE_LAYER_ID = 'bearing-range-lines-layer'
const DEFAULT_MAP_CURSOR = 'crosshair'
const BEARING_RANGE_DRAW_CURSOR = 'pointer'
const BEARING_RANGE_CONTEXT_MENU_CURSOR = 'context-menu'
const PREVIEW_LINE_ID = 'bearing-range-preview-line'

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
    while (normalizedEndLng - startLng > 180) normalizedEndLng -= 360
    while (normalizedEndLng - startLng < -180) normalizedEndLng += 360
    return normalizedEndLng
}

function normalizeLngLatToShortestPath(startLngLat, endLngLat) {
    return {lng: normalizeLongitudeToShortestPath(startLngLat.lng, endLngLat.lng), lat: endLngLat.lat}
}

function calculateBearingAndRange(startLngLat, endLngLat) {
    const earthRadiusMeters = 6371008.8
    const normalizedEndLngLat = normalizeLngLatToShortestPath(startLngLat, endLngLat)

    const lat1 = toRadians(startLngLat.lat)
    const lat2 = toRadians(normalizedEndLngLat.lat)
    const deltaLat = toRadians(normalizedEndLngLat.lat - startLngLat.lat)
    const deltaLng = toRadians(normalizedEndLngLat.lng - startLngLat.lng)

    const haversine = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

    const distanceMeters = 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine),)

    const y = Math.sin(deltaLng) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)

    return {
        bearingDegrees: normalizeBearing(toDegrees(Math.atan2(y, x))), rangeNauticalMiles: distanceMeters / 1852,
    }
}

function getMidpoint(startLngLat, endLngLat) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(startLngLat, endLngLat)

    return {
        lng: (startLngLat.lng + normalizedEndLngLat.lng) / 2, lat: (startLngLat.lat + normalizedEndLngLat.lat) / 2,
    }
}

function formatBearingRange(line) {
    const bearing = Math.round(line.bearingDegrees).toString().padStart(3, '0')
    const range = Math.round(line.rangeNauticalMiles).toString()

    return `${bearing}/${range}`
}

function createLine(start, end, {id = crypto.randomUUID(), isPreview = false} = {}) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(start.lngLat, end.lngLat)
    const {bearingDegrees, rangeNauticalMiles} = calculateBearingAndRange(start.lngLat, normalizedEndLngLat)

    return {
        id,
        isPreview,
        start: start.lngLat,
        end: normalizedEndLngLat,
        startPoint: start.point,
        endPoint: end.point,
        midpoint: getMidpoint(start.lngLat, normalizedEndLngLat),
        bearingDegrees,
        rangeNauticalMiles,
    }
}

function buildLineFeature(line) {
    const normalizedEndLngLat = normalizeLngLatToShortestPath(line.start, line.end)

    return {
        type: 'Feature', properties: {
            id: line.id, opacity: 1,
        }, geometry: {
            type: 'LineString',
            coordinates: [[line.start.lng, line.start.lat], [normalizedEndLngLat.lng, normalizedEndLngLat.lat],],
        },
    }
}

function buildFeatureCollection(lines) {
    return {
        type: 'FeatureCollection', features: lines.map(buildLineFeature),
    }
}

function ensureLineLayer(map, lineColor) {
    if (!map.getSource(LINE_SOURCE_ID)) {
        map.addSource(LINE_SOURCE_ID, {
            type: 'geojson', data: buildFeatureCollection([]),
        })
    }

    if (!map.getLayer(LINE_LAYER_ID)) {
        map.addLayer({
            id: LINE_LAYER_ID, type: 'line', source: LINE_SOURCE_ID, paint: {
                'line-color': lineColor, 'line-width': 4, 'line-opacity': ['get', 'opacity'],
            }, layout: {
                'line-cap': 'round', 'line-join': 'round',
            },
        })

        return
    }

    map.setPaintProperty(LINE_LAYER_ID, 'line-color', lineColor)
    map.setPaintProperty(LINE_LAYER_ID, 'line-opacity', ['get', 'opacity'])
}

function updateLineSource(map, visibleLines) {
    const source = map.getSource(LINE_SOURCE_ID)

    if (source) {
        source.setData(buildFeatureCollection(visibleLines))
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
    element.style.opacity = '1'

    element.textContent = formatBearingRange(line)

    return element
}

function getLabelLongitudeCopies(map, midpointLng) {
    const bounds = map.getBounds()
    const west = bounds.getWest()
    const east = bounds.getEast()
    const copies = []

    for (let lng = midpointLng - 720; lng <= midpointLng + 720; lng += 360) {
        if (lng >= west - 360 && lng <= east + 360) copies.push(lng)
    }

    return copies.length > 0 ? copies : [midpointLng]
}

function getDistancePixels(startPoint, endPoint) {
    return Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y,)
}

export function useBearingRangeTool(mapRef, enabled, {
    onContextMenu, lineColor = '#fff',
} = {},) {
    const {controlBindings} = useControlBindings()
    const mapCursorBindings = controlBindings.mapCursor
    const bearingRangeBindings = controlBindings.bearingRangeTool

    const labelsRef = useRef([])
    const dragStartRef = useRef(null)
    const previewLineRef = useRef(null)
    const linesRef = useRef([])
    const lineColorRef = useRef(lineColor)
    const visibleLinesRef = useRef([])
    const rehydrateTimeoutRef = useRef(null)

    const [lines, setLines] = useState([])
    const [previewLine, setPreviewLine] = useState(null)
    const [isDrawingBearingRangeLine, setIsDrawingBearingRangeLine] = useState(false)
    const [labelWorldVersion, setLabelWorldVersion] = useState(0)

    useEffect(() => {
        linesRef.current = lines
    }, [lines])

    const visibleLines = useMemo(() => {
        return previewLine ? [...lines, previewLine] : lines
    }, [lines, previewLine])

    useEffect(() => {
        lineColorRef.current = lineColor
    }, [lineColor])

    useEffect(() => {
        visibleLinesRef.current = visibleLines
    }, [visibleLines])

    const syncLineLayer = useCallback(() => {
        const map = mapRef.current

        if (!map || !map.isStyleLoaded()) {
            return false
        }

        ensureLineLayer(map, lineColorRef.current)
        updateLineSource(map, visibleLinesRef.current)

        return true
    }, [mapRef])

    const rehydrateLineLayer = useCallback(() => {
        if (rehydrateTimeoutRef.current) {
            window.clearTimeout(rehydrateTimeoutRef.current)
            rehydrateTimeoutRef.current = null
        }

        const attemptRehydrate = () => {
            const map = mapRef.current

            if (!map) {
                return
            }

            if (!map.isStyleLoaded()) {
                rehydrateTimeoutRef.current = window.setTimeout(attemptRehydrate, 50)
                return
            }

            syncLineLayer()
        }

        attemptRehydrate()
    }, [mapRef, syncLineLayer])

    const setCurrentPreviewLine = useCallback((line) => {
        previewLineRef.current = line
        setPreviewLine(line)
    }, [])

    const clearPreviewLine = useCallback(() => {
        previewLineRef.current = null
        setPreviewLine(null)
    }, [])

    const removeBearingRangeLine = useCallback((lineId) => {
        setLines((currentLines) => {
            const nextLines = currentLines.filter((line) => line.id !== lineId)
            linesRef.current = nextLines
            return nextLines
        })
        clearPreviewLine()
    }, [clearPreviewLine])

    const clearBearingRangeLines = useCallback(() => {
        linesRef.current = []
        setLines([])
        clearPreviewLine()
    }, [clearPreviewLine])

    useEffect(() => {
        if (!enabled || !mapRef.current) return

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
        if (!enabled || !mapRef.current) {
            return
        }

        const map = mapRef.current

        const handleStyleLoad = () => {
            rehydrateLineLayer()
        }

        rehydrateLineLayer()

        map.on('style.load', handleStyleLoad)
        map.once('idle', handleStyleLoad)

        return () => {
            map.off('style.load', handleStyleLoad)

            if (rehydrateTimeoutRef.current) {
                window.clearTimeout(rehydrateTimeoutRef.current)
                rehydrateTimeoutRef.current = null
            }
        }
    }, [mapRef, enabled, rehydrateLineLayer])

    useEffect(() => {
        if (!enabled || !mapRef.current) {
            return
        }

        if (syncLineLayer()) {
            return
        }

        rehydrateLineLayer()
    }, [mapRef, enabled, visibleLines, lineColor, syncLineLayer, rehydrateLineLayer])

    useEffect(() => {
        if (!enabled || !mapRef.current) return

        const map = mapRef.current

        labelsRef.current.forEach((marker) => marker.remove())
        labelsRef.current = []

        visibleLines.forEach((line) => {
            const isMoreVertical = Math.abs(line.endPoint.y - line.startPoint.y) > Math.abs(line.endPoint.x - line.startPoint.x)

            const labelLongitudes = getLabelLongitudeCopies(map, line.midpoint.lng)

            labelLongitudes.forEach((lng) => {
                const element = createLabelElement(line)

                const marker = new maplibregl.Marker({
                    element, anchor: isMoreVertical ? 'left' : 'bottom', offset: isMoreVertical ? [14, 0] : [0, -12],
                })
                    .setLngLat({
                        lng, lat: line.midpoint.lat,
                    })
                    .addTo(map)

                labelsRef.current.push(marker)
            })
        })

        return () => {
            labelsRef.current.forEach((marker) => marker.remove())
            labelsRef.current = []
        }
    }, [mapRef, enabled, visibleLines, labelWorldVersion])

    useEffect(() => {
        if (!enabled || !mapRef.current) return

        const map = mapRef.current
        const canvas = map.getCanvas()

        const getDragPoint = (event) => {
            const bounds = canvas.getBoundingClientRect()
            const mapPoint = {
                x: event.clientX - bounds.left, y: event.clientY - bounds.top,
            }

            return {
                point: {
                    x: event.clientX, y: event.clientY,
                }, mapPoint, lngLat: map.unproject([mapPoint.x, mapPoint.y]),
            }
        }

        const getBearingRangeLineAtPoint = (dragPoint) => {
            if (!map.getLayer(LINE_LAYER_ID)) return null

            const features = map.queryRenderedFeatures([[dragPoint.mapPoint.x - 6, dragPoint.mapPoint.y - 6], [dragPoint.mapPoint.x + 6, dragPoint.mapPoint.y + 6],], {
                layers: [LINE_LAYER_ID],
            },)

            const lineId = features.find((feature) => feature.properties?.id !== PREVIEW_LINE_ID)?.properties?.id

            if (!lineId) return null

            return linesRef.current.find((line) => line.id === lineId) ?? null
        }

        const updateCursor = (event) => {
            if (dragStartRef.current)
                return

            const buttons = getMouseEventButtons(event)
            const shiftKey = event.shiftKey ?? event.originalEvent?.shiftKey

            if (
                pressedMouseButtonsMatchBinding(buttons, mapCursorBindings.dragButton)
                || pressedMouseButtonsMatchBinding(buttons, bearingRangeBindings.drawButton)
                || shiftKey
            )
                return

            const hoveredLine = getBearingRangeLineAtPoint(getDragPoint(event))

            canvas.style.cursor = hoveredLine ? BEARING_RANGE_CONTEXT_MENU_CURSOR : DEFAULT_MAP_CURSOR
        }

        const handleMouseDown = (event) => {
            if (!mouseButtonMatchesBinding(getMouseEventButton(event), bearingRangeBindings.drawButton))
                return

            event.preventDefault()
            canvas.style.cursor = BEARING_RANGE_DRAW_CURSOR

            dragStartRef.current = {
                time: performance.now(), ...getDragPoint(event),
            }

            setIsDrawingBearingRangeLine(true)
            clearPreviewLine()
        }

        const handleMouseMove = (event) => {
            const dragStart = dragStartRef.current

            if (!dragStart) {
                updateCursor(event)
                return
            }

            event.preventDefault()
            canvas.style.cursor = BEARING_RANGE_DRAW_CURSOR

            const currentPoint = getDragPoint(event)
            const deltaPixels = getDistancePixels(dragStart.point, currentPoint.point)

            if (deltaPixels < bearingRangeBindings.minPersistedLinePixels) {
                clearPreviewLine()
                return
            }

            setCurrentPreviewLine(createLine(dragStart, currentPoint, {
                id: PREVIEW_LINE_ID, isPreview: true,
            }))
        }

        const handleMouseUp = (event) => {
            const dragStart = dragStartRef.current
            const eventButton = getMouseEventButton(event)

            if (!mouseButtonMatchesBinding(eventButton, bearingRangeBindings.drawButton) || !dragStart)
                return

            event.preventDefault()

            const endPoint = getDragPoint(event)
            const deltaTime = performance.now() - dragStart.time
            const deltaPixels = getDistancePixels(dragStart.point, endPoint.point)

            dragStartRef.current = null
            setIsDrawingBearingRangeLine(false)

            const shouldOpenContextMenu = mouseButtonMatchesBinding(eventButton, bearingRangeBindings.contextMenuButton)
                && deltaTime <= bearingRangeBindings.contextMenuMaxMs
                && deltaPixels <= bearingRangeBindings.contextMenuMaxPixels

            if (shouldOpenContextMenu) {
                clearPreviewLine()

                onContextMenu?.({
                    point: endPoint.point,
                    mapPoint: endPoint.mapPoint,
                    lngLat: endPoint.lngLat,
                    line: getBearingRangeLineAtPoint(endPoint),
                })

                return
            }

            if (deltaPixels < bearingRangeBindings.minPersistedLinePixels) {
                clearPreviewLine()
                return
            }

            const lineToCommit = createLine(dragStart, endPoint)

            clearPreviewLine()
            setLines((currentLines) => [...currentLines, lineToCommit])
        }

        const handleContextMenu = (event) => {
            if (mouseButtonMatchesBinding(getMouseEventButton(event), bearingRangeBindings.contextMenuButton))
                event.preventDefault()
        }

        const handleMouseLeave = () => {
            canvas.style.cursor = DEFAULT_MAP_CURSOR
        }

        const cancelDrag = () => {
            dragStartRef.current = null
            setIsDrawingBearingRangeLine(false)
            clearPreviewLine()
            canvas.style.cursor = DEFAULT_MAP_CURSOR
        }

        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('mouseleave', handleMouseLeave)
        canvas.addEventListener('contextmenu', handleContextMenu)
        window.addEventListener('blur', cancelDrag)

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown)
            canvas.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
            canvas.removeEventListener('mouseleave', handleMouseLeave)
            canvas.removeEventListener('contextmenu', handleContextMenu)
            window.removeEventListener('blur', cancelDrag)
        }
    }, [mapRef, enabled, onContextMenu, clearPreviewLine, setCurrentPreviewLine, mapCursorBindings, bearingRangeBindings])

    return {
        lines, isDrawingBearingRangeLine, removeBearingRangeLine, clearBearingRangeLines,
    }
}