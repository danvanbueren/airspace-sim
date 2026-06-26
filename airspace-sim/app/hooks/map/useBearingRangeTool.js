import {useCallback, useEffect, useRef, useState} from 'react'
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
import {
    createBearingRangeLine,
    getDistancePixels,
} from '../../tools/map/bearingRangeGeometry.js'
import {BearingRangeLabelManager} from '../../tools/map/bearingRangeLabels.js'
import {
    getBearingRangeLineAtMapPoint,
    setBearingRangeLines,
} from '../../tools/map/bearingRangeMapLayer.js'
import {
    createPreviewOverlay,
    drawPreviewOnOverlay,
    removePreviewOverlay,
    resizePreviewOverlay,
} from '../../tools/map/bearingRangePreviewCanvas.js'

const BEARING_RANGE_DRAW_CURSOR = 'pointer'
const BEARING_RANGE_CONTEXT_MENU_CURSOR = 'context-menu'

export function useBearingRangeTool(mapRef, enabled, {
    onContextMenu, lineColor = '#fff', mapCursor,
} = {}) {
    const {controlBindings} = useControlBindings()

    const linesRef = useRef([])
    const dragRef = useRef(null)
    const previewOverlayRef = useRef(null)
    const activePointerIdRef = useRef(null)
    const labelManagerRef = useRef(new BearingRangeLabelManager())
    const appliedLineColorRef = useRef(null)
    const lineColorRef = useRef(lineColor)

    const bindingsRef = useRef(controlBindings.bearingRangeTool)
    const mapCursorBindingsRef = useRef(controlBindings.mapCursor)
    const mapCursorRef = useRef(mapCursor)
    const onContextMenuRef = useRef(onContextMenu)

    bindingsRef.current = controlBindings.bearingRangeTool
    mapCursorBindingsRef.current = controlBindings.mapCursor
    mapCursorRef.current = mapCursor
    onContextMenuRef.current = onContextMenu
    lineColorRef.current = lineColor

    const [lines, setLines] = useState([])
    const [isDrawingBearingRangeLine, setIsDrawingBearingRangeLine] = useState(false)
    const [labelWorldVersion, setLabelWorldVersion] = useState(0)

    const applyLinesToMap = useCallback(() => {
        const map = mapRef.current

        if (!map) {
            return false
        }

        return setBearingRangeLines(map, linesRef.current, lineColorRef.current, appliedLineColorRef)
    }, [mapRef])

    const syncLabels = useCallback((previewLine = null) => {
        const map = mapRef.current

        if (!map) {
            labelManagerRef.current.remove()
            return
        }

        labelManagerRef.current.sync(map, linesRef.current, {previewLine})
    }, [mapRef])

    const clearPreview = useCallback(() => {
        removePreviewOverlay(previewOverlayRef.current)
        previewOverlayRef.current = null
    }, [])

    const redrawPreview = useCallback((previewLine, showNormalizationGuide) => {
        const map = mapRef.current
        const overlay = previewOverlayRef.current

        if (!map || !overlay || !previewLine) {
            return
        }

        resizePreviewOverlay(map, overlay)
        drawPreviewOnOverlay(map, overlay, previewLine, lineColorRef.current, {showNormalizationGuide})
    }, [])

    const commitLines = useCallback((nextLines, {previewLine = null} = {}) => {
        linesRef.current = nextLines
        setLines(nextLines)
        applyLinesToMap()
        syncLabels(previewLine)
    }, [applyLinesToMap, syncLabels])

    const removeBearingRangeLine = useCallback((lineId) => {
        clearPreview()
        commitLines(linesRef.current.filter((line) => line.id !== lineId))
    }, [clearPreview, commitLines])

    const clearBearingRangeLines = useCallback(() => {
        clearPreview()
        commitLines([])
    }, [clearPreview, commitLines])

    const rehydrateAfterStyleLoad = useCallback(() => {
        appliedLineColorRef.current = null
        applyLinesToMap()
        syncLabels()
    }, [applyLinesToMap, syncLabels])

    useEffect(() => {
        if (!enabled || !mapRef.current) {
            return
        }

        const map = mapRef.current

        const refreshLabels = () => {
            setLabelWorldVersion((version) => version + 1)
        }

        map.on('moveend', refreshLabels)
        map.on('zoomend', refreshLabels)

        return () => {
            map.off('moveend', refreshLabels)
            map.off('zoomend', refreshLabels)
        }
    }, [enabled, mapRef])

    useEffect(() => {
        if (!enabled || !mapRef.current || dragRef.current) {
            return
        }

        syncLabels()
    }, [enabled, lines, labelWorldVersion, mapRef, syncLabels])

    useEffect(() => {
        if (!enabled || !mapRef.current) {
            return
        }

        const map = mapRef.current

        const handleStyleLoad = () => {
            rehydrateAfterStyleLoad()
        }

        const redrawPreviewOnViewChange = () => {
            if (!dragRef.current || !previewOverlayRef.current) {
                return
            }

            const previewLine = createBearingRangeLine(dragRef.current.start, dragRef.current.current)
            redrawPreview(previewLine, true)
        }

        map.on('style.load', handleStyleLoad)
        map.on('resize', redrawPreviewOnViewChange)
        map.on('move', redrawPreviewOnViewChange)
        map.on('zoom', redrawPreviewOnViewChange)

        rehydrateAfterStyleLoad()

        return () => {
            map.off('style.load', handleStyleLoad)
            map.off('resize', redrawPreviewOnViewChange)
            map.off('move', redrawPreviewOnViewChange)
            map.off('zoom', redrawPreviewOnViewChange)
        }
    }, [enabled, mapRef, redrawPreview, rehydrateAfterStyleLoad])

    useEffect(() => {
        if (!enabled) {
            return
        }

        appliedLineColorRef.current = null
        applyLinesToMap()
    }, [enabled, lineColor, applyLinesToMap])

    useEffect(() => {
        if (!enabled || !mapRef.current) {
            return
        }

        const map = mapRef.current
        const canvas = map.getCanvas()

        const getDragPoint = (event) => {
            const bounds = canvas.getBoundingClientRect()
            const mapPoint = {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            }

            return {
                point: {x: event.clientX, y: event.clientY},
                mapPoint,
                lngLat: map.unproject([mapPoint.x, mapPoint.y]),
            }
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
            const drag = dragRef.current

            if (!drag) {
                return
            }

            const bindings = bindingsRef.current
            const eventButton = getMouseEventButton(event)
            const endPoint = getDragPoint(event)
            const deltaTime = performance.now() - drag.time
            const deltaPixels = getDistancePixels(drag.start.point, endPoint.point)

            dragRef.current = null
            stopWindowPointerTracking()
            releasePointerCapture(event)
            setIsDrawingBearingRangeLine(false)
            mapCursorRef.current.clearCursorRequest(MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW)
            clearPreview()

            const shouldOpenContextMenu = mouseButtonMatchesBinding(eventButton, bindings.contextMenuButton)
                && deltaTime <= bindings.contextMenuMaxMs
                && deltaPixels <= bindings.contextMenuMaxPixels

            if (shouldOpenContextMenu) {
                onContextMenuRef.current?.({
                    point: endPoint.point,
                    mapPoint: endPoint.mapPoint,
                    lngLat: endPoint.lngLat,
                    line: getBearingRangeLineAtMapPoint(map, endPoint.mapPoint, linesRef.current),
                })
                syncLabels()
                return
            }

            if (deltaPixels < bindings.minPersistedLinePixels) {
                syncLabels()
                return
            }

            const lineToCommit = createBearingRangeLine(drag.start, endPoint)
            commitLines([...linesRef.current, lineToCommit])
        }

        const handlePointerDown = (event) => {
            const bindings = bindingsRef.current

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

            dragRef.current = {
                time: performance.now(),
                start: getDragPoint(event),
                current: getDragPoint(event),
            }
            previewOverlayRef.current = createPreviewOverlay(map)

            startWindowPointerTracking()
            setIsDrawingBearingRangeLine(true)
        }

        const handlePointerMove = (event) => {
            const drag = dragRef.current

            if (!drag) {
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

            const bindings = bindingsRef.current
            const currentPoint = getDragPoint(event)
            const deltaPixels = getDistancePixels(drag.start.point, currentPoint.point)

            drag.current = currentPoint

            if (deltaPixels < bindings.minPersistedLinePixels) {
                clearPreview()
                syncLabels()
                return
            }

            if (!previewOverlayRef.current) {
                previewOverlayRef.current = createPreviewOverlay(map)
            }

            const previewLine = createBearingRangeLine(drag.start, currentPoint)
            redrawPreview(previewLine, true)
            syncLabels(previewLine)
        }

        const handlePointerUp = (event) => {
            if (!dragRef.current) {
                return
            }

            if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
                return
            }

            event.preventDefault()
            finishDrag(event)
        }

        const updateCursor = (event) => {
            if (dragRef.current) {
                clearHoverCursor()
                return
            }

            const bindings = bindingsRef.current
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

            const hoveredLine = getBearingRangeLineAtMapPoint(map, getDragPoint(event).mapPoint, linesRef.current)

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
            const bindings = bindingsRef.current

            if (mouseButtonMatchesBinding(getMouseEventButton(event), bindings.contextMenuButton)) {
                event.preventDefault()
            }
        }

        const cancelDrag = () => {
            dragRef.current = null
            stopWindowPointerTracking()
            releasePointerCapture()
            setIsDrawingBearingRangeLine(false)
            clearPreview()
            syncLabels()
            mapCursorRef.current.clearCursorRequests([
                MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW,
                MAP_CURSOR_REQUESTS.BEARING_RANGE_HOVER,
            ])
        }

        const handlePointerCancel = (event) => {
            if (activePointerIdRef.current !== null && event.pointerId !== activePointerIdRef.current) {
                return
            }

            cancelDrag()
        }

        const handleMouseLeave = () => {
            if (!dragRef.current) {
                clearHoverCursor()
            }
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
            clearPreview()
            labelManagerRef.current.remove()
            mapCursorRef.current.clearCursorRequests([
                MAP_CURSOR_REQUESTS.BEARING_RANGE_DRAW,
                MAP_CURSOR_REQUESTS.BEARING_RANGE_HOVER,
            ])
        }
    }, [enabled, mapRef, clearPreview, commitLines, redrawPreview, syncLabels])

    return {
        lines,
        isDrawingBearingRangeLine,
        removeBearingRangeLine,
        clearBearingRangeLines,
    }
}
