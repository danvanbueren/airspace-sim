import {useCallback, useEffect, useRef, useState} from 'react'
import maplibregl from 'maplibre-gl'
import {
    getMouseEventButton,
    getMouseEventButtons,
    mouseButtonMatchesBinding,
    pressedMouseButtonsMatchBinding,
    useControlBindings,
} from '../../contexts/ControlBindingsContext'
import {
    MAP_CURSOR_PRIORITIES,
    MAP_CURSOR_REQUESTS,
} from './useMapCursorState'

const COMMITTED_SOURCE_ID = 'bearing-range-lines-source'
const COMMITTED_LAYER_ID = 'bearing-range-lines-layer'
const PREVIEW_SOURCE_ID = 'bearing-range-preview-source'
const PREVIEW_LAYER_ID = 'bearing-range-preview-layer'
const BEARING_RANGE_DRAW_CURSOR = 'pointer'
const BEARING_RANGE_CONTEXT_MENU_CURSOR = 'context-menu'
const PREVIEW_LINE_ID = 'bearing-range-preview-line'
const EMPTY_FEATURE_COLLECTION = {type: 'FeatureCollection', features: []}

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

function moveBearingRangeLayersToTop(map) {
    if (map.getLayer(COMMITTED_LAYER_ID)) {
        map.moveLayer(COMMITTED_LAYER_ID)
    }

    if (map.getLayer(PREVIEW_LAYER_ID)) {
        map.moveLayer(PREVIEW_LAYER_ID)
    }
}

function ensureBearingRangeLayers(map, lineColor, appliedLineColorRef) {
    if (!map.getSource(COMMITTED_SOURCE_ID)) {
        map.addSource(COMMITTED_SOURCE_ID, {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION,
        })
    }

    if (!map.getSource(PREVIEW_SOURCE_ID)) {
        map.addSource(PREVIEW_SOURCE_ID, {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION,
        })
    }

    if (!map.getLayer(COMMITTED_LAYER_ID)) {
        map.addLayer({
            id: COMMITTED_LAYER_ID,
            type: 'line',
            source: COMMITTED_SOURCE_ID,
            paint: getLinePaint(lineColor),
            layout: getLineLayout(),
        })
    }

    if (!map.getLayer(PREVIEW_LAYER_ID)) {
        map.addLayer({
            id: PREVIEW_LAYER_ID,
            type: 'line',
            source: PREVIEW_SOURCE_ID,
            paint: getLinePaint(lineColor),
            layout: getLineLayout(),
        })
    }

    if (appliedLineColorRef.current !== lineColor) {
        map.setPaintProperty(COMMITTED_LAYER_ID, 'line-color', lineColor)
        map.setPaintProperty(PREVIEW_LAYER_ID, 'line-color', lineColor)
        appliedLineColorRef.current = lineColor
    }

    moveBearingRangeLayersToTop(map)
}

function setGeoJsonSourceData(map, sourceId, data) {
    const source = map.getSource(sourceId)

    if (!source) {
        return false
    }

    source.setData(data)
    map.triggerRepaint()

    return true
}

export function useBearingRangeTool(mapRef, enabled, {
    onContextMenu, lineColor = '#fff', mapCursor,
} = {},) {
    const {controlBindings} = useControlBindings()
    const mapCursorBindings = controlBindings.mapCursor
    const bearingRangeBindings = controlBindings.bearingRangeTool

    const labelsRef = useRef([])
    const previewLabelMarkersRef = useRef([])
    const dragStartRef = useRef(null)
    const previewLineRef = useRef(null)
    const linesRef = useRef([])
    const lineColorRef = useRef(lineColor)
    const appliedLineColorRef = useRef(null)
    const rehydrateTimeoutRef = useRef(null)
    const previewSyncFrameRef = useRef(null)
    const bearingRangeBindingsRef = useRef(bearingRangeBindings)
    const mapCursorBindingsRef = useRef(mapCursorBindings)
    const mapCursorRef = useRef(mapCursor)
    const onContextMenuRef = useRef(onContextMenu)
    const activePointerIdRef = useRef(null)
    const isDraggingRef = useRef(false)
    const clearPreviewRef = useRef(() => {})
    const schedulePreviewSyncRef = useRef(() => {})

    bearingRangeBindingsRef.current = bearingRangeBindings
    mapCursorBindingsRef.current = mapCursorBindings
    mapCursorRef.current = mapCursor
    onContextMenuRef.current = onContextMenu
    lineColorRef.current = lineColor

    const [lines, setLines] = useState([])
    const [isDrawingBearingRangeLine, setIsDrawingBearingRangeLine] = useState(false)
    const [labelWorldVersion, setLabelWorldVersion] = useState(0)

    useEffect(() => {
        linesRef.current = lines
    }, [lines])

    const syncCommittedLinesToMap = useCallback(() => {
        const map = mapRef.current

        if (!map?.isStyleLoaded()) {
            return false
        }

        ensureBearingRangeLayers(map, lineColorRef.current, appliedLineColorRef)
        setGeoJsonSourceData(map, COMMITTED_SOURCE_ID, buildFeatureCollection(linesRef.current))

        return true
    }, [mapRef])

    const syncPreviewLineToMap = useCallback((previewLine = previewLineRef.current) => {
        const map = mapRef.current

        if (!map?.isStyleLoaded()) {
            return false
        }

        ensureBearingRangeLayers(map, lineColorRef.current, appliedLineColorRef)

        const previewData = previewLine
            ? buildFeatureCollection([previewLine])
            : EMPTY_FEATURE_COLLECTION

        setGeoJsonSourceData(map, PREVIEW_SOURCE_ID, previewData)

        return true
    }, [mapRef])

    const clearPreviewLabelMarkers = useCallback(() => {
        previewLabelMarkersRef.current.forEach((marker) => marker.remove())
        previewLabelMarkersRef.current = []
    }, [])

    const updatePreviewLabelMarkers = useCallback((line) => {
        const map = mapRef.current

        if (!map || !line) {
            clearPreviewLabelMarkers()
            return
        }

        const isMoreVertical = Math.abs(line.endPoint.y - line.startPoint.y) > Math.abs(line.endPoint.x - line.startPoint.x)
        const labelLongitudes = getLabelLongitudeCopies(map, line.midpoint.lng)
        const labelText = formatBearingRange(line)

        if (previewLabelMarkersRef.current.length !== labelLongitudes.length) {
            clearPreviewLabelMarkers()

            previewLabelMarkersRef.current = labelLongitudes.map((lng) => {
                const element = createLabelElement(line)

                return new maplibregl.Marker({
                    element,
                    anchor: isMoreVertical ? 'left' : 'bottom',
                    offset: isMoreVertical ? [14, 0] : [0, -12],
                })
                    .setLngLat({lng, lat: line.midpoint.lat})
                    .addTo(map)
            })

            return
        }

        previewLabelMarkersRef.current.forEach((marker, index) => {
            const lng = labelLongitudes[index]
            const element = marker.getElement()

            if (element.textContent !== labelText) {
                element.textContent = labelText
            }

            marker.setLngLat({lng, lat: line.midpoint.lat})
        })
    }, [clearPreviewLabelMarkers, mapRef])

    const clearPreview = useCallback(() => {
        previewLineRef.current = null
        clearPreviewLabelMarkers()
        syncPreviewLineToMap(null)
    }, [clearPreviewLabelMarkers, syncPreviewLineToMap])

    const schedulePreviewSync = useCallback(() => {
        if (previewSyncFrameRef.current) {
            return
        }

        previewSyncFrameRef.current = requestAnimationFrame(() => {
            previewSyncFrameRef.current = null

            const previewLine = previewLineRef.current

            syncPreviewLineToMap(previewLine)
            updatePreviewLabelMarkers(previewLine)
        })
    }, [syncPreviewLineToMap, updatePreviewLabelMarkers])

    clearPreviewRef.current = clearPreview
    schedulePreviewSyncRef.current = schedulePreviewSync

    const rehydrateLayers = useCallback(() => {
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

            appliedLineColorRef.current = null
            syncCommittedLinesToMap()
            syncPreviewLineToMap()
            moveBearingRangeLayersToTop(map)
        }

        attemptRehydrate()
    }, [mapRef, syncCommittedLinesToMap, syncPreviewLineToMap])

    const removeBearingRangeLine = useCallback((lineId) => {
        setLines((currentLines) => {
            const nextLines = currentLines.filter((line) => line.id !== lineId)
            linesRef.current = nextLines
            syncCommittedLinesToMap()
            return nextLines
        })
    }, [syncCommittedLinesToMap])

    const clearBearingRangeLines = useCallback(() => {
        linesRef.current = []
        setLines([])
        clearPreview()
        syncCommittedLinesToMap()
    }, [clearPreview, syncCommittedLinesToMap])

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
            rehydrateLayers()
        }

        const handleIdle = () => {
            if (!map.isStyleLoaded()) {
                return
            }

            const layersMissing = !map.getLayer(COMMITTED_LAYER_ID) || !map.getLayer(PREVIEW_LAYER_ID)

            if (layersMissing) {
                rehydrateLayers()
                return
            }

            moveBearingRangeLayersToTop(map)
        }

        rehydrateLayers()

        map.on('style.load', handleStyleLoad)
        map.on('idle', handleIdle)

        return () => {
            map.off('style.load', handleStyleLoad)
            map.off('idle', handleIdle)

            if (rehydrateTimeoutRef.current) {
                window.clearTimeout(rehydrateTimeoutRef.current)
                rehydrateTimeoutRef.current = null
            }

            if (previewSyncFrameRef.current) {
                cancelAnimationFrame(previewSyncFrameRef.current)
                previewSyncFrameRef.current = null
            }
        }
    }, [enabled, mapRef, rehydrateLayers, syncCommittedLinesToMap, syncPreviewLineToMap])

    useEffect(() => {
        if (!enabled || !mapRef.current || isDraggingRef.current) {
            return
        }

        syncCommittedLinesToMap()
    }, [enabled, lines, lineColor, mapRef, syncCommittedLinesToMap])

    useEffect(() => {
        if (!enabled || !mapRef.current) return

        const map = mapRef.current

        labelsRef.current.forEach((marker) => marker.remove())
        labelsRef.current = []

        lines.forEach((line) => {
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
    }, [mapRef, enabled, lines, labelWorldVersion])

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
            const layers = [COMMITTED_LAYER_ID, PREVIEW_LAYER_ID].filter((layerId) => map.getLayer(layerId))

            if (layers.length === 0) return null

            const features = map.queryRenderedFeatures([[dragPoint.mapPoint.x - 6, dragPoint.mapPoint.y - 6], [dragPoint.mapPoint.x + 6, dragPoint.mapPoint.y + 6],], {
                layers,
            },)

            const lineId = features.find((feature) => feature.properties?.id !== PREVIEW_LINE_ID)?.properties?.id

            if (!lineId) return null

            return linesRef.current.find((line) => line.id === lineId) ?? null
        }

        const clearHoverCursor = () => {
            mapCursorRef.current.clearCursorRequest(MAP_CURSOR_REQUESTS.BEARING_RANGE_HOVER)
        }

        const releasePointerCapture = (event) => {
            const pointerId = event?.pointerId ?? activePointerIdRef.current

            if (pointerId === null || activePointerIdRef.current === null) {
                activePointerIdRef.current = null
                return
            }

            if (activePointerIdRef.current === pointerId && canvas.hasPointerCapture?.(pointerId)) {
                canvas.releasePointerCapture(pointerId)
            }

            activePointerIdRef.current = null
        }

        const updateCursor = (event) => {
            if (dragStartRef.current) {
                clearHoverCursor()
                return
            }

            const bindings = bearingRangeBindingsRef.current
            const cursorBindings = mapCursorBindingsRef.current
            const buttons = getMouseEventButtons(event)
            const shiftKey = event.shiftKey ?? event.originalEvent?.shiftKey

            if (
                pressedMouseButtonsMatchBinding(buttons, cursorBindings.dragButton)
                || pressedMouseButtonsMatchBinding(buttons, bindings.drawButton)
                || shiftKey
            ) {
                clearHoverCursor()
                return
            }

            const hoveredLine = getBearingRangeLineAtPoint(getDragPoint(event))

            if (hoveredLine) {
                mapCursorRef.current.requestCursor(
                    MAP_CURSOR_REQUESTS.BEARING_RANGE_HOVER,
                    BEARING_RANGE_CONTEXT_MENU_CURSOR,
                    MAP_CURSOR_PRIORITIES.CONTEXT,
                )
                return
            }

            clearHoverCursor()
        }

        const finishDrag = (event) => {
            const dragStart = dragStartRef.current

            if (!dragStart) {
                return
            }

            const bindings = bearingRangeBindingsRef.current
            const eventButton = getMouseEventButton(event)
            const endPoint = getDragPoint(event)
            const deltaTime = performance.now() - dragStart.time
            const deltaPixels = getDistancePixels(dragStart.point, endPoint.point)

            isDraggingRef.current = false
            dragStartRef.current = null
            releasePointerCapture(event)
            setIsDrawingBearingRangeLine(false)
            mapCursorRef.current.clearCursorRequest(MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW)

            const shouldOpenContextMenu = mouseButtonMatchesBinding(eventButton, bindings.contextMenuButton)
                && deltaTime <= bindings.contextMenuMaxMs
                && deltaPixels <= bindings.contextMenuMaxPixels

            if (shouldOpenContextMenu) {
                clearPreviewRef.current()

                onContextMenuRef.current?.({
                    point: endPoint.point,
                    mapPoint: endPoint.mapPoint,
                    lngLat: endPoint.lngLat,
                    line: getBearingRangeLineAtPoint(endPoint),
                })

                return
            }

            if (deltaPixels < bindings.minPersistedLinePixels) {
                clearPreviewRef.current()
                return
            }

            const lineToCommit = createLine(dragStart, endPoint)
            const nextLines = [...linesRef.current, lineToCommit]

            linesRef.current = nextLines
            previewLineRef.current = null
            clearPreviewLabelMarkers()
            setGeoJsonSourceData(map, PREVIEW_SOURCE_ID, EMPTY_FEATURE_COLLECTION)
            setGeoJsonSourceData(map, COMMITTED_SOURCE_ID, buildFeatureCollection(nextLines))
            moveBearingRangeLayersToTop(map)
            setLines(nextLines)
        }

        const handlePointerDown = (event) => {
            const bindings = bearingRangeBindingsRef.current

            if (!mouseButtonMatchesBinding(event.button, bindings.drawButton)) {
                return
            }

            event.preventDefault()
            clearHoverCursor()
            mapCursorRef.current.requestCursor(
                MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW,
                BEARING_RANGE_DRAW_CURSOR,
                MAP_CURSOR_PRIORITIES.ACTIVE,
            )

            activePointerIdRef.current = event.pointerId
            canvas.setPointerCapture?.(event.pointerId)

            isDraggingRef.current = true
            dragStartRef.current = {
                time: performance.now(), ...getDragPoint(event),
            }

            setIsDrawingBearingRangeLine(true)
            clearPreviewRef.current()
        }

        const handlePointerMove = (event) => {
            const dragStart = dragStartRef.current

            if (!dragStart) {
                updateCursor(event)
                return
            }

            if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
                return
            }

            event.preventDefault()
            mapCursorRef.current.requestCursor(
                MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW,
                BEARING_RANGE_DRAW_CURSOR,
                MAP_CURSOR_PRIORITIES.ACTIVE,
            )

            const bindings = bearingRangeBindingsRef.current
            const currentPoint = getDragPoint(event)
            const deltaPixels = getDistancePixels(dragStart.point, currentPoint.point)

            if (deltaPixels < bindings.minPersistedLinePixels) {
                if (previewLineRef.current) {
                    clearPreviewRef.current()
                }

                return
            }

            previewLineRef.current = createLine(dragStart, currentPoint, {
                id: PREVIEW_LINE_ID, isPreview: true,
            })
            schedulePreviewSyncRef.current()
        }

        const handlePointerUp = (event) => {
            const dragStart = dragStartRef.current

            if (!dragStart) {
                return
            }

            if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
                return
            }

            const bindings = bearingRangeBindingsRef.current
            const hasPointerCapture = activePointerIdRef.current !== null
                && event.pointerId === activePointerIdRef.current
                && canvas.hasPointerCapture?.(event.pointerId)
            const drawButtonStillPressed = pressedMouseButtonsMatchBinding(
                getMouseEventButtons(event),
                bindings.drawButton,
            )

            if (!hasPointerCapture && drawButtonStillPressed) {
                return
            }

            event.preventDefault()
            finishDrag(event)
        }

        const handleContextMenu = (event) => {
            const bindings = bearingRangeBindingsRef.current

            if (mouseButtonMatchesBinding(getMouseEventButton(event), bindings.contextMenuButton)) {
                event.preventDefault()
            }
        }

        const handlePointerCancel = (event) => {
            if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
                return
            }

            isDraggingRef.current = false
            releasePointerCapture(event)
            dragStartRef.current = null
            setIsDrawingBearingRangeLine(false)
            clearPreviewRef.current()
            mapCursorRef.current.clearCursorRequests([
                MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW,
                MAP_CURSOR_REQUESTS.BEARING_RANGE_HOVER,
            ])
        }

        const handleMouseLeave = () => {
            if (!dragStartRef.current) {
                clearHoverCursor()
            }
        }

        const cancelDrag = () => {
            isDraggingRef.current = false
            releasePointerCapture()
            dragStartRef.current = null
            setIsDrawingBearingRangeLine(false)
            clearPreviewRef.current()
            mapCursorRef.current.clearCursorRequests([
                MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW,
                MAP_CURSOR_REQUESTS.BEARING_RANGE_HOVER,
            ])
        }

        canvas.addEventListener('pointerdown', handlePointerDown)
        canvas.addEventListener('pointermove', handlePointerMove)
        canvas.addEventListener('pointerup', handlePointerUp)
        canvas.addEventListener('pointercancel', handlePointerCancel)
        window.addEventListener('pointerup', handlePointerUp)
        canvas.addEventListener('mouseleave', handleMouseLeave)
        canvas.addEventListener('contextmenu', handleContextMenu)
        window.addEventListener('blur', cancelDrag)

        return () => {
            canvas.removeEventListener('pointerdown', handlePointerDown)
            canvas.removeEventListener('pointermove', handlePointerMove)
            canvas.removeEventListener('pointerup', handlePointerUp)
            canvas.removeEventListener('pointercancel', handlePointerCancel)
            window.removeEventListener('pointerup', handlePointerUp)
            canvas.removeEventListener('mouseleave', handleMouseLeave)
            canvas.removeEventListener('contextmenu', handleContextMenu)
            window.removeEventListener('blur', cancelDrag)
            releasePointerCapture()
            mapCursorRef.current.clearCursorRequests([
                MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW,
                MAP_CURSOR_REQUESTS.BEARING_RANGE_HOVER,
            ])
        }
    }, [mapRef, enabled])

    return {
        lines, isDrawingBearingRangeLine, removeBearingRangeLine, clearBearingRangeLines,
    }
}
