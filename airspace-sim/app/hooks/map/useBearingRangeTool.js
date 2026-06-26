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
const PREVIEW_OVERLAY_CLASS = 'bearing-range-preview-overlay'
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
    const isEndNormalized = Math.abs(normalizedEndLngLat.lng - end.lngLat.lng) > 1e-6

    return {
        id,
        isPreview,
        start: start.lngLat,
        end: normalizedEndLngLat,
        rawEnd: end.lngLat,
        isEndNormalized,
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
        type: 'Feature',
        id: line.id,
        properties: {
            id: line.id,
            opacity: 1,
        },
        geometry: {
            type: 'LineString',
            coordinates: [[line.start.lng, line.start.lat], [normalizedEndLngLat.lng, normalizedEndLngLat.lat]],
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

function getLineWorldCopyOffsets(map, line) {
    const bounds = map.getBounds()
    const west = bounds.getWest()
    const east = bounds.getEast()
    const offsets = []

    for (let worldCopyOffset = -720; worldCopyOffset <= 720; worldCopyOffset += 360) {
        const midpointLng = line.midpoint.lng + worldCopyOffset

        if (midpointLng >= west - 360 && midpointLng <= east + 360) {
            offsets.push(worldCopyOffset)
        }
    }

    return offsets.length > 0 ? offsets : [0]
}

function getLabelLongitudeCopies(map, midpointLng) {
    const referenceLine = {
        midpoint: {lng: midpointLng, lat: 0},
        start: {lng: midpointLng, lat: 0},
        end: {lng: midpointLng, lat: 0},
    }

    return getLineWorldCopyOffsets(map, referenceLine).map((offset) => midpointLng + offset)
}

function buildCopiedLine(line, worldCopyOffset) {
    if (worldCopyOffset === 0) {
        return line
    }

    return {
        ...line,
        start: {lng: line.start.lng + worldCopyOffset, lat: line.start.lat},
        end: {lng: line.end.lng + worldCopyOffset, lat: line.end.lat},
        midpoint: {lng: line.midpoint.lng + worldCopyOffset, lat: line.midpoint.lat},
    }
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

function moveCommittedLayerToTop(map) {
    if (map.getLayer(COMMITTED_LAYER_ID)) {
        map.moveLayer(COMMITTED_LAYER_ID)
    }
}

function ensureCommittedLineLayer(map, lineColor, appliedLineColorRef) {
    if (!map.getSource(COMMITTED_SOURCE_ID)) {
        map.addSource(COMMITTED_SOURCE_ID, {
            type: 'geojson',
            data: EMPTY_FEATURE_COLLECTION,
            lineMetrics: true,
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
        moveCommittedLayerToTop(map)
    }

    if (appliedLineColorRef.current !== lineColor) {
        map.setPaintProperty(COMMITTED_LAYER_ID, 'line-color', lineColor)
        appliedLineColorRef.current = lineColor
    }
}

function setCommittedLineData(map, lines) {
    const source = map.getSource(COMMITTED_SOURCE_ID)

    if (!source) {
        return false
    }

    source.setData(buildFeatureCollection(lines))
    map.triggerRepaint()

    return true
}

async function setCommittedLineDataAsync(map, lines) {
    const source = map.getSource(COMMITTED_SOURCE_ID)

    if (!source) {
        return false
    }

    await source.setData(buildFeatureCollection(lines), true)
    map.triggerRepaint()
    moveCommittedLayerToTop(map)

    return true
}

function getLineSampleMapPoints(map, line) {
    const points = [
        map.project([line.start.lng, line.start.lat]),
        map.project([line.midpoint.lng, line.midpoint.lat]),
        map.project([line.end.lng, line.end.lat]),
    ]

    return points.map((point) => ({x: point.x, y: point.y}))
}

function isCommittedLineRendered(map, lineId, sampleMapPoints) {
    if (!map.getLayer(COMMITTED_LAYER_ID)) {
        return false
    }

    return sampleMapPoints.some((point) => {
        const features = map.queryRenderedFeatures([
            [point.x - 8, point.y - 8],
            [point.x + 8, point.y + 8],
        ], {
            layers: [COMMITTED_LAYER_ID],
        })

        return features.some((feature) => feature.properties?.id === lineId)
    })
}

function waitForCommittedLineRendered(map, lineId, line, {
    timeoutMs = 1500,
    isCancelled = () => false,
} = {}) {
    const deadline = performance.now() + timeoutMs

    return new Promise((resolve) => {
        const attempt = () => {
            if (isCancelled()) {
                resolve(false)
                return
            }

            const sampleMapPoints = getLineSampleMapPoints(map, line)

            if (isCommittedLineRendered(map, lineId, sampleMapPoints)) {
                resolve(true)
                return
            }

            if (performance.now() >= deadline) {
                resolve(false)
                return
            }

            map.once('idle', attempt)
        }

        const sampleMapPoints = getLineSampleMapPoints(map, line)

        if (isCommittedLineRendered(map, lineId, sampleMapPoints)) {
            resolve(true)
            return
        }

        map.once('idle', attempt)
    })
}

function createPreviewOverlay(map) {
    const mapCanvas = map.getCanvas()
    const host = mapCanvas.parentElement

    if (!host) {
        return null
    }

    const existingOverlay = host.querySelector(`.${PREVIEW_OVERLAY_CLASS}`)

    if (existingOverlay) {
        existingOverlay.remove()
    }

    const overlay = document.createElement('canvas')

    overlay.className = PREVIEW_OVERLAY_CLASS
    overlay.style.position = 'absolute'
    overlay.style.inset = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.pointerEvents = 'none'
    overlay.style.zIndex = '2'

    host.appendChild(overlay)
    resizePreviewOverlay(map, overlay)

    return overlay
}

function resizePreviewOverlay(map, overlay) {
    const mapCanvas = map.getCanvas()
    const width = mapCanvas.clientWidth
    const height = mapCanvas.clientHeight
    const dpr = window.devicePixelRatio || 1

    overlay.width = Math.max(1, Math.round(width * dpr))
    overlay.height = Math.max(1, Math.round(height * dpr))
    overlay.style.width = `${width}px`
    overlay.style.height = `${height}px`
}

function buildLineScreenSegments(map, line) {
    const canvas = map.getCanvas()
    const maxScreenJumpX = canvas.clientWidth / 2
    const maxScreenJumpY = canvas.clientHeight / 2
    const startPoint = map.project([line.start.lng, line.start.lat])
    const endPoint = map.project([line.end.lng, line.end.lat])
    const segment = [
        {x: startPoint.x, y: startPoint.y},
        {x: endPoint.x, y: endPoint.y},
    ]

    const deltaX = Math.abs(segment[1].x - segment[0].x)
    const deltaY = Math.abs(segment[1].y - segment[0].y)

    if (deltaX > maxScreenJumpX || deltaY > maxScreenJumpY) {
        return []
    }

    return [segment]
}

function strokeScreenSegments(context, segments, scaleX, scaleY) {
    segments.forEach((segment) => {
        context.beginPath()
        segment.forEach((point, index) => {
            const x = point.x * scaleX
            const y = point.y * scaleY

            if (index === 0) {
                context.moveTo(x, y)
                return
            }

            context.lineTo(x, y)
        })
        context.stroke()
    })
}

function drawDashedScreenLine(context, fromPoint, toPoint, scaleX, scaleY, lineColor) {
    context.save()
    context.setLineDash([10 * scaleX, 8 * scaleX])
    context.globalAlpha = 0.7
    context.strokeStyle = lineColor
    context.lineWidth = 2 * scaleX
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(fromPoint.x * scaleX, fromPoint.y * scaleY)
    context.lineTo(toPoint.x * scaleX, toPoint.y * scaleY)
    context.stroke()
    context.restore()
}

function drawPreviewOnOverlay(map, overlay, line, lineColor, {showNormalizationGuide = false} = {}) {
    const context = overlay.getContext('2d')

    if (!context) {
        return
    }

    const scaleX = overlay.width / overlay.clientWidth
    const scaleY = overlay.height / overlay.clientHeight

    context.clearRect(0, 0, overlay.width, overlay.height)
    context.strokeStyle = lineColor
    context.lineWidth = 4 * scaleX
    context.lineCap = 'round'
    context.lineJoin = 'round'

    getLineWorldCopyOffsets(map, line).forEach((worldCopyOffset) => {
        const copiedLine = buildCopiedLine(line, worldCopyOffset)
        const segments = buildLineScreenSegments(map, copiedLine)

        strokeScreenSegments(context, segments, scaleX, scaleY)
    })

    if (showNormalizationGuide && line.isEndNormalized && line.startPoint && line.endPoint) {
        const canvas = map.getCanvas()
        const bounds = canvas.getBoundingClientRect()
        const startPoint = {
            x: line.startPoint.x - bounds.left,
            y: line.startPoint.y - bounds.top,
        }
        const cursorPoint = {
            x: line.endPoint.x - bounds.left,
            y: line.endPoint.y - bounds.top,
        }

        if (
            Number.isFinite(startPoint.x) && Number.isFinite(startPoint.y)
            && Number.isFinite(cursorPoint.x) && Number.isFinite(cursorPoint.y)
        ) {
            drawDashedScreenLine(
                context,
                startPoint,
                cursorPoint,
                scaleX,
                scaleY,
                lineColor,
            )
        }
    }
}

function clearPreviewOverlay(overlay) {
    if (!overlay) {
        return
    }

    const context = overlay.getContext('2d')

    if (context) {
        context.clearRect(0, 0, overlay.width, overlay.height)
    }
}

function removePreviewOverlay(overlay) {
    overlay?.remove()
}

export function useBearingRangeTool(mapRef, enabled, {
    onContextMenu, lineColor = '#fff', mapCursor,
} = {},) {
    const {controlBindings} = useControlBindings()
    const mapCursorBindings = controlBindings.mapCursor
    const bearingRangeBindings = controlBindings.bearingRangeTool

    const labelsRef = useRef([])
    const previewLabelMarkersRef = useRef([])
    const previewOverlayRef = useRef(null)
    const dragStartRef = useRef(null)
    const previewLineRef = useRef(null)
    const linesRef = useRef([])
    const lineColorRef = useRef(lineColor)
    const appliedLineColorRef = useRef(null)
    const rehydrateTimeoutRef = useRef(null)
    const bearingRangeBindingsRef = useRef(bearingRangeBindings)
    const mapCursorBindingsRef = useRef(mapCursorBindings)
    const mapCursorRef = useRef(mapCursor)
    const onContextMenuRef = useRef(onContextMenu)
    const activePointerIdRef = useRef(null)
    const isDraggingRef = useRef(false)
    const clearDragPreviewRef = useRef(() => {})
    const removeDragPreviewRef = useRef(() => {})
    const hidePreviewOverlayOnlyRef = useRef(() => {})
    const clearPreviewLabelMarkersRef = useRef(() => {})
    const updatePreviewLabelMarkersRef = useRef(() => {})
    const pendingCommitGenerationRef = useRef(0)
    const handoffDataReadyRef = useRef(false)
    const handoffInProgressRef = useRef(false)
    const handoffCancelFnRef = useRef(null)
    const redrawPreviewOverlayRef = useRef(() => {})
    const syncCommittedLinesToMapRef = useRef(() => {})

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

        ensureCommittedLineLayer(map, lineColorRef.current, appliedLineColorRef)
        setCommittedLineData(map, linesRef.current)
        moveCommittedLayerToTop(map)

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

    const clearDragPreview = useCallback(() => {
        previewLineRef.current = null
        clearPreviewLabelMarkers()
        clearPreviewOverlay(previewOverlayRef.current)
    }, [clearPreviewLabelMarkers])

    const removeDragPreview = useCallback(() => {
        previewLineRef.current = null
        clearPreviewLabelMarkers()
        removePreviewOverlay(previewOverlayRef.current)
        previewOverlayRef.current = null
    }, [clearPreviewLabelMarkers])

    const hidePreviewOverlayOnly = useCallback(() => {
        previewLineRef.current = null
        removePreviewOverlay(previewOverlayRef.current)
        previewOverlayRef.current = null
        handoffDataReadyRef.current = false
        handoffInProgressRef.current = false
    }, [])

    const cancelHandoffWait = useCallback(() => {
        handoffCancelFnRef.current?.()
        handoffCancelFnRef.current = null
        handoffDataReadyRef.current = false
    }, [])

    const redrawPreviewOverlay = useCallback(() => {
        const map = mapRef.current
        const previewLine = previewLineRef.current
        const overlay = previewOverlayRef.current

        if (!map || !previewLine || !overlay) {
            return
        }

        resizePreviewOverlay(map, overlay)
        drawPreviewOnOverlay(map, overlay, previewLine, lineColorRef.current, {
            showNormalizationGuide: isDraggingRef.current,
        })
    }, [mapRef])

    clearDragPreviewRef.current = clearDragPreview
    removeDragPreviewRef.current = removeDragPreview
    hidePreviewOverlayOnlyRef.current = hidePreviewOverlayOnly
    clearPreviewLabelMarkersRef.current = clearPreviewLabelMarkers
    updatePreviewLabelMarkersRef.current = updatePreviewLabelMarkers
    redrawPreviewOverlayRef.current = redrawPreviewOverlay
    syncCommittedLinesToMapRef.current = syncCommittedLinesToMap

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
        }

        attemptRehydrate()
    }, [mapRef, syncCommittedLinesToMap])

    const cancelPendingCommits = useCallback(() => {
        pendingCommitGenerationRef.current += 1
        cancelHandoffWait()
        handoffInProgressRef.current = false
        handoffDataReadyRef.current = false
        hidePreviewOverlayOnly()
    }, [cancelHandoffWait, hidePreviewOverlayOnly])

    const removeBearingRangeLine = useCallback((lineId) => {
        cancelPendingCommits()

        setLines((currentLines) => {
            const nextLines = currentLines.filter((line) => line.id !== lineId)
            linesRef.current = nextLines
            return nextLines
        })
        syncCommittedLinesToMap()
    }, [cancelPendingCommits, syncCommittedLinesToMap])

    const clearBearingRangeLines = useCallback(() => {
        cancelPendingCommits()
        linesRef.current = []
        setLines([])
        removeDragPreview()
        syncCommittedLinesToMap()
    }, [cancelPendingCommits, removeDragPreview, syncCommittedLinesToMap])

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
            if (!map.isStyleLoaded() || isDraggingRef.current) {
                return
            }

            if (!map.getLayer(COMMITTED_LAYER_ID)) {
                rehydrateLayers()
                return
            }

            syncCommittedLinesToMap()
        }

        const handleViewChange = () => {
            if (!previewOverlayRef.current || !previewLineRef.current) {
                return
            }

            if (isDraggingRef.current || handoffInProgressRef.current) {
                redrawPreviewOverlayRef.current()

                if (handoffInProgressRef.current && handoffDataReadyRef.current) {
                    cancelHandoffWait()
                    hidePreviewOverlayOnlyRef.current()
                }

                return
            }

            if (handoffDataReadyRef.current) {
                cancelHandoffWait()
                hidePreviewOverlayOnlyRef.current()
            }
        }

        const handleResize = () => {
            handleViewChange()
        }

        rehydrateLayers()

        map.on('style.load', handleStyleLoad)
        map.on('idle', handleIdle)
        map.on('resize', handleResize)
        map.on('move', handleViewChange)
        map.on('zoom', handleViewChange)

        return () => {
            map.off('style.load', handleStyleLoad)
            map.off('idle', handleIdle)
            map.off('resize', handleResize)
            map.off('move', handleViewChange)
            map.off('zoom', handleViewChange)

            if (rehydrateTimeoutRef.current) {
                window.clearTimeout(rehydrateTimeoutRef.current)
                rehydrateTimeoutRef.current = null
            }
        }
    }, [enabled, mapRef, rehydrateLayers, syncCommittedLinesToMap])

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
            if (!map.getLayer(COMMITTED_LAYER_ID)) return null

            const features = map.queryRenderedFeatures([[dragPoint.mapPoint.x - 6, dragPoint.mapPoint.y - 6], [dragPoint.mapPoint.x + 6, dragPoint.mapPoint.y + 6],], {
                layers: [COMMITTED_LAYER_ID],
            },)

            const lineId = features[0]?.properties?.id

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

        const stopWindowPointerTracking = () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
        }

        const startWindowPointerTracking = () => {
            window.addEventListener('pointermove', handlePointerMove)
            window.addEventListener('pointerup', handlePointerUp)
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
            stopWindowPointerTracking()
            releasePointerCapture(event)
            setIsDrawingBearingRangeLine(false)
            mapCursorRef.current.clearCursorRequest(MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW)

            const shouldOpenContextMenu = mouseButtonMatchesBinding(eventButton, bindings.contextMenuButton)
                && deltaTime <= bindings.contextMenuMaxMs
                && deltaPixels <= bindings.contextMenuMaxPixels

            if (shouldOpenContextMenu) {
                removeDragPreviewRef.current()

                onContextMenuRef.current?.({
                    point: endPoint.point,
                    mapPoint: endPoint.mapPoint,
                    lngLat: endPoint.lngLat,
                    line: getBearingRangeLineAtPoint(endPoint),
                })

                return
            }

            if (deltaPixels < bindings.minPersistedLinePixels) {
                removeDragPreviewRef.current()
                return
            }

            const lineToCommit = createLine(dragStart, endPoint)
            const nextLines = [...linesRef.current, lineToCommit]
            const commitGeneration = pendingCommitGenerationRef.current
            let handoffCancelled = false

            handoffDataReadyRef.current = false
            handoffInProgressRef.current = true
            handoffCancelFnRef.current = () => {
                handoffCancelled = true
            }

            linesRef.current = nextLines
            clearPreviewLabelMarkersRef.current()
            setLines(nextLines)
            previewLineRef.current = lineToCommit

            if (previewOverlayRef.current) {
                drawPreviewOnOverlay(
                    map,
                    previewOverlayRef.current,
                    lineToCommit,
                    lineColorRef.current,
                    {showNormalizationGuide: false},
                )
            }

            const isHandoffCancelled = () => (
                handoffCancelled || pendingCommitGenerationRef.current !== commitGeneration
            )

            void (async () => {
                try {
                    ensureCommittedLineLayer(map, lineColorRef.current, appliedLineColorRef)

                    const committed = await setCommittedLineDataAsync(map, linesRef.current)

                    if (!committed) {
                        return
                    }

                    if (isHandoffCancelled()) {
                        syncCommittedLinesToMapRef.current()
                        return
                    }

                    handoffDataReadyRef.current = true

                    await waitForCommittedLineRendered(
                        map,
                        lineToCommit.id,
                        lineToCommit,
                        {isCancelled: isHandoffCancelled},
                    )
                } finally {
                    handoffCancelFnRef.current = null
                    handoffDataReadyRef.current = false
                    handoffInProgressRef.current = false

                    if (isHandoffCancelled()) {
                        syncCommittedLinesToMapRef.current()
                    } else {
                        hidePreviewOverlayOnlyRef.current()
                    }
                }
            })()
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

            pendingCommitGenerationRef.current += 1
            cancelHandoffWait()
            isDraggingRef.current = true
            dragStartRef.current = {
                time: performance.now(), ...getDragPoint(event),
            }
            previewOverlayRef.current = createPreviewOverlay(map)

            startWindowPointerTracking()
            setIsDrawingBearingRangeLine(true)
            clearDragPreviewRef.current()
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
                if (previewLineRef.current || previewOverlayRef.current) {
                    clearDragPreviewRef.current()
                }

                return
            }

            const previewLine = createLine(dragStart, currentPoint, {
                id: PREVIEW_LINE_ID, isPreview: true,
            })

            previewLineRef.current = previewLine

            if (!previewOverlayRef.current) {
                previewOverlayRef.current = createPreviewOverlay(map)
            }

            drawPreviewOnOverlay(
                map,
                previewOverlayRef.current,
                previewLine,
                lineColorRef.current,
                {showNormalizationGuide: true},
            )
            updatePreviewLabelMarkersRef.current(previewLine)
        }

        const handlePointerUp = (event) => {
            if (!dragStartRef.current) {
                return
            }

            if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
                return
            }

            event.preventDefault()
            finishDrag(event)
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
            stopWindowPointerTracking()
            releasePointerCapture(event)
            dragStartRef.current = null
            setIsDrawingBearingRangeLine(false)
            removeDragPreviewRef.current()
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
            stopWindowPointerTracking()
            releasePointerCapture()
            dragStartRef.current = null
            setIsDrawingBearingRangeLine(false)
            removeDragPreviewRef.current()
            mapCursorRef.current.clearCursorRequests([
                MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW,
                MAP_CURSOR_REQUESTS.BEARING_RANGE_HOVER,
            ])
        }

        canvas.addEventListener('pointerdown', handlePointerDown)
        canvas.addEventListener('pointermove', handlePointerMove)
        canvas.addEventListener('pointerup', handlePointerUp)
        canvas.addEventListener('pointercancel', handlePointerCancel)
        canvas.addEventListener('mouseleave', handleMouseLeave)
        canvas.addEventListener('contextmenu', handleContextMenu)
        window.addEventListener('blur', cancelDrag)

        return () => {
            stopWindowPointerTracking()
            canvas.removeEventListener('pointerdown', handlePointerDown)
            canvas.removeEventListener('pointermove', handlePointerMove)
            canvas.removeEventListener('pointerup', handlePointerUp)
            canvas.removeEventListener('pointercancel', handlePointerCancel)
            canvas.removeEventListener('mouseleave', handleMouseLeave)
            canvas.removeEventListener('contextmenu', handleContextMenu)
            window.removeEventListener('blur', cancelDrag)
            releasePointerCapture()
            removeDragPreviewRef.current()
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
