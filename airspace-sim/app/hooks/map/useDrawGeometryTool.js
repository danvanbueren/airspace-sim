'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {
    keyMatchesBinding,
    useControlBindings,
} from '@/app/contexts/ControlBindingsContext'
import {useDrawGeometry} from '@/app/contexts/DrawGeometryContext'
import {
    MAP_CURSOR_PRIORITIES,
    MAP_CURSOR_REQUESTS,
} from '@/app/hooks/map/useMapCursorState'
import {
    deriveAxisAlignedHalfExtentsNm,
    deriveCircleRadiusNm,
    deriveRacetrackRadiusNm,
    deriveSquareHalfSizeNm,
    getRacetrackMaxRadiusNm,
} from '@/app/tools/map/drawGeometry/drawGeometryGeometry'
import {
    isGeometryShapeComplete,
    isGeometryShapeInPendingDrawStatus,
    normalizeLngLat,
} from '@/app/tools/map/drawGeometry/drawGeometryModels'
import {
    GEOMETRY_HIT_TEST_PIXEL_RADIUS,
    GEOMETRY_SHAPE_TYPES,
    GEOMETRY_STATUS,
} from '@/app/tools/map/drawGeometry/drawGeometryTypes'
import {
    createDrawGeometryPreviewOverlay,
    drawGeometryPreviewOnOverlay,
    removeDrawGeometryPreviewOverlay,
    resizeDrawGeometryPreviewOverlay,
} from '@/app/tools/map/drawGeometry/drawGeometryPreviewCanvas'
import {
    getDrawGeometryShapeAtMapPoint,
    rehydrateDrawGeometryShapes,
    setDrawGeometryShapes,
} from '@/app/tools/map/drawGeometry/drawGeometryMapLayer'
import {getDrawGeometryCursor} from '@/app/tools/map/drawGeometry/drawGeometryCursor'
import {roundDrawGeometryParams} from '@/app/tools/map/drawGeometry/drawGeometryRounding'
import {getRacetrackAxisLinePreview} from '@/app/tools/map/drawGeometry/drawGeometryRacetrackPreview'

function getDistancePixels(firstPoint, secondPoint) {
    const deltaX = firstPoint.x - secondPoint.x
    const deltaY = firstPoint.y - secondPoint.y

    return Math.hypot(deltaX, deltaY)
}

function deriveDrawingPhaseForShape(shape) {
    if (!shape || shape.status !== GEOMETRY_STATUS.PENDING) {
        return 0
    }

    const {type, params} = shape

    switch (type) {
        case GEOMETRY_SHAPE_TYPES.RECTANGLE:
        case GEOMETRY_SHAPE_TYPES.OVAL:
        case GEOMETRY_SHAPE_TYPES.SQUARE:
        case GEOMETRY_SHAPE_TYPES.CIRCLE:
            return params.center ? 1 : 0
        case GEOMETRY_SHAPE_TYPES.RACETRACK:
            if (!params.center1) {
                return 0
            }

            if (!params.center2) {
                return 1
            }

            return 2
        case GEOMETRY_SHAPE_TYPES.POLYGON:
            return params.vertices?.length ?? 0
        default:
            return 0
    }
}

export function useDrawGeometryTool(
    mapRef,
    enabled,
    {
        mapCursor,
        themeMode = 'dark',
        onShapePrimaryClick,
        onShapeCommitted,
        onDrawingCancelled,
        isKeyboardCustodyActive,
    } = {},
) {
    const {controlBindings} = useControlBindings()
    const {
        shapes,
        activeShapeId,
        updateShape,
        deleteShape,
        cancelPendingShape,
        getShapeById,
        getStrokeColor,
        getFillColor,
    } = useDrawGeometry()

    const shapesRef = useRef(shapes)
    const activeShapeIdRef = useRef(activeShapeId)
    const drawingPhaseRef = useRef(0)
    const polygonPreviewLngLatRef = useRef(null)
    const racetrackPreviewLngLatRef = useRef(null)
    const previewOverlayRef = useRef(null)
    const appliedColorsRef = useRef(null)
    const bindingsRef = useRef(controlBindings.drawGeometryTool)
    const mapCursorRef = useRef(mapCursor)
    const themeModeRef = useRef(themeMode)
    const isKeyboardCustodyActiveRef = useRef(isKeyboardCustodyActive)

    shapesRef.current = shapes
    activeShapeIdRef.current = activeShapeId
    bindingsRef.current = controlBindings.drawGeometryTool
    mapCursorRef.current = mapCursor
    themeModeRef.current = themeMode
    isKeyboardCustodyActiveRef.current = isKeyboardCustodyActive

    const [isDrawingGeometry, setIsDrawingGeometry] = useState(false)

    const getRenderableShapes = useCallback(() => shapesRef.current, [])

    const getPreviewShapes = useCallback(() => {
        const shapesList = shapesRef.current.map((shape) => ({...shape, params: {...shape.params}}))
        const activeShape = activeShapeIdRef.current
            ? shapesList.find((shape) => shape.id === activeShapeIdRef.current)
            : null

        if (
            activeShape?.type === GEOMETRY_SHAPE_TYPES.POLYGON
            && polygonPreviewLngLatRef.current
            && (activeShape.params.vertices?.length ?? 0) > 0
        ) {
            activeShape.params.vertices = [
                ...activeShape.params.vertices,
                polygonPreviewLngLatRef.current,
            ]
        }

        return shapesList
    }, [])

    const getRacetrackConstructionPreview = useCallback(() => {
        const shapeId = activeShapeIdRef.current
        const shape = shapeId ? getShapeById(shapeId) : null
        const axisLine = getRacetrackAxisLinePreview({
            shape,
            phase: drawingPhaseRef.current,
            cursorPoint: racetrackPreviewLngLatRef.current,
        })

        if (!axisLine) {
            return null
        }

        return {axisLine}
    }, [getShapeById])

    const clearPreview = useCallback(() => {
        removeDrawGeometryPreviewOverlay(previewOverlayRef.current)
        previewOverlayRef.current = null
    }, [])

    const redrawPreview = useCallback(() => {
        const map = mapRef.current
        const overlay = previewOverlayRef.current

        if (!map || !overlay) {
            return
        }

        resizeDrawGeometryPreviewOverlay(map, overlay)
        drawGeometryPreviewOnOverlay(
            map,
            overlay,
            getPreviewShapes(),
            getStrokeColor(themeModeRef.current),
            getRacetrackConstructionPreview(),
        )
    }, [getPreviewShapes, getRacetrackConstructionPreview, getStrokeColor, mapRef])

    const flushShapesToMapLayer = useCallback(() => {
        const map = mapRef.current

        if (!map) {
            return false
        }

        const strokeColor = getStrokeColor(themeModeRef.current)
        const fillColor = getFillColor(themeModeRef.current)
        const textHaloColor = themeModeRef.current === 'dark' ? '#111111' : '#ffffff'

        return setDrawGeometryShapes(
            map,
            getRenderableShapes(),
            strokeColor,
            fillColor,
            textHaloColor,
            appliedColorsRef,
        )
    }, [getFillColor, getRenderableShapes, getStrokeColor, mapRef])

    const ensurePreviewOverlay = useCallback(() => {
        const map = mapRef.current

        if (!map) {
            return
        }

        if (!previewOverlayRef.current) {
            previewOverlayRef.current = createDrawGeometryPreviewOverlay(map)
        }

        redrawPreview()
    }, [mapRef, redrawPreview])

    const syncMapAndPreview = useCallback(() => {
        if (!flushShapesToMapLayer()) {
            const map = mapRef.current

            if (map) {
                const handleIdle = () => {
                    flushShapesToMapLayer()
                }

                map.once('idle', handleIdle)
            }
        }

        ensurePreviewOverlay()
    }, [ensurePreviewOverlay, flushShapesToMapLayer, mapRef])

    const resetDrawingInteraction = useCallback(() => {
        drawingPhaseRef.current = 0
        polygonPreviewLngLatRef.current = null
        racetrackPreviewLngLatRef.current = null
        setIsDrawingGeometry(false)
    }, [])

    const clearDrawGeometryCursor = useCallback(() => {
        mapCursorRef.current?.clearCursorRequest(MAP_CURSOR_REQUESTS.DRAW_GEOMETRY)
    }, [])

    const clearGeometryHoverCursor = useCallback(() => {
        mapCursorRef.current?.clearCursorRequest(MAP_CURSOR_REQUESTS.GEOMETRY_HOVER)
    }, [])

    const isPendingDrawMode = useCallback(() => {
        const shapeId = activeShapeIdRef.current

        if (!shapeId) {
            return false
        }

        const shape = getShapeById(shapeId)

        return isGeometryShapeInPendingDrawStatus(shape)
    }, [getShapeById])

    const applyDrawGeometryCursor = useCallback(() => {
        mapCursorRef.current?.requestCursor(
            MAP_CURSOR_REQUESTS.DRAW_GEOMETRY,
            getDrawGeometryCursor(themeModeRef.current),
            MAP_CURSOR_PRIORITIES.ACTIVE,
        )
    }, [])

    const applyGeometryHoverCursor = useCallback(() => {
        mapCursorRef.current?.requestCursor(
            MAP_CURSOR_REQUESTS.GEOMETRY_HOVER,
            'pointer',
            MAP_CURSOR_PRIORITIES.HOVER,
        )
    }, [])

    const updateMapCursorForPointer = useCallback((mapPoint) => {
        const map = mapRef.current

        if (!map) {
            return
        }

        if (isPendingDrawMode()) {
            clearGeometryHoverCursor()
            applyDrawGeometryCursor()
            return
        }

        clearDrawGeometryCursor()

        const hoveredShape = getDrawGeometryShapeAtMapPoint(
            map,
            mapPoint,
            shapesRef.current,
            GEOMETRY_HIT_TEST_PIXEL_RADIUS,
        )

        if (hoveredShape) {
            applyGeometryHoverCursor()
            return
        }

        clearGeometryHoverCursor()
    }, [
        applyDrawGeometryCursor,
        applyGeometryHoverCursor,
        clearDrawGeometryCursor,
        clearGeometryHoverCursor,
        isPendingDrawMode,
        mapRef,
    ])

    const resetDrawingPhase = useCallback(() => {
        resetDrawingInteraction()
        clearDrawGeometryCursor()
        clearGeometryHoverCursor()
    }, [clearDrawGeometryCursor, clearGeometryHoverCursor, resetDrawingInteraction])

    const applyShapeUpdate = useCallback((shapeId, paramsUpdate, extraUpdates = {}) => {
        updateShape(shapeId, {
            ...extraUpdates,
            params: roundDrawGeometryParams(paramsUpdate),
        })
        syncMapAndPreview()
    }, [syncMapAndPreview, updateShape])

    const finalizeShapeIfComplete = useCallback((shapeId) => {
        const shape = getShapeById(shapeId)

        if (!shape || !isGeometryShapeComplete(shape)) {
            return false
        }

        updateShape(shapeId, {status: GEOMETRY_STATUS.COMMITTED})
        resetDrawingPhase()
        onShapeCommitted?.(shape)
        syncMapAndPreview()
        return true
    }, [getShapeById, onShapeCommitted, resetDrawingPhase, syncMapAndPreview, updateShape])

    const handlePolygonClick = useCallback((shape, lngLat, mapPoint) => {
        const vertices = [...(shape.params.vertices ?? [])]

        if (vertices.length >= 3) {
            const firstVertex = vertices[0]
            const firstPoint = mapRef.current?.project([firstVertex.lng, firstVertex.lat])

            if (
                firstPoint
                && getDistancePixels(firstPoint, mapPoint) <= GEOMETRY_HIT_TEST_PIXEL_RADIUS
            ) {
                applyShapeUpdate(shape.id, {
                    vertices,
                    closed: true,
                    finalized: true,
                })
                finalizeShapeIfComplete(shape.id)
                return true
            }
        }

        vertices.push(normalizeLngLat(lngLat))
        polygonPreviewLngLatRef.current = null
        applyShapeUpdate(shape.id, {vertices, closed: false, finalized: false})

        if (vertices.length >= 2) {
            drawingPhaseRef.current = vertices.length
        }

        return true
    }, [applyShapeUpdate, finalizeShapeIfComplete, mapRef])

    const handleMapDrawClick = useCallback((lngLat, mapPointFromEvent = null) => {
        const shapeId = activeShapeIdRef.current
        const shape = shapeId ? getShapeById(shapeId) : null

        if (!shape) {
            return
        }

        const point = normalizeLngLat(lngLat)

        if (!point) {
            return
        }

        const map = mapRef.current
        const mapPoint = mapPointFromEvent ?? map?.project([point.lng, point.lat])
        const params = getShapeById(shape.id)?.params ?? shape.params

        setIsDrawingGeometry(true)

        switch (shape.type) {
            case GEOMETRY_SHAPE_TYPES.RECTANGLE: {
                if (drawingPhaseRef.current === 0) {
                    applyShapeUpdate(shape.id, {
                        center: point,
                        halfWidthNm: 0,
                        halfHeightNm: 0,
                    })
                    drawingPhaseRef.current = 1
                    return
                }

                const {halfWidthNm, halfHeightNm} = deriveAxisAlignedHalfExtentsNm(params.center, point)

                applyShapeUpdate(shape.id, {halfWidthNm, halfHeightNm})
                finalizeShapeIfComplete(shape.id)
                return
            }
            case GEOMETRY_SHAPE_TYPES.SQUARE: {
                if (drawingPhaseRef.current === 0) {
                    applyShapeUpdate(shape.id, {
                        center: point,
                        halfSizeNm: 0,
                    })
                    drawingPhaseRef.current = 1
                    return
                }

                const halfSizeNm = deriveSquareHalfSizeNm(params.center, point)

                applyShapeUpdate(shape.id, {halfSizeNm})
                finalizeShapeIfComplete(shape.id)
                return
            }
            case GEOMETRY_SHAPE_TYPES.CIRCLE: {
                if (drawingPhaseRef.current === 0) {
                    applyShapeUpdate(shape.id, {
                        center: point,
                        radiusNm: 0,
                    })
                    drawingPhaseRef.current = 1
                    return
                }

                const radiusNm = deriveCircleRadiusNm(params.center, point)

                applyShapeUpdate(shape.id, {radiusNm})
                finalizeShapeIfComplete(shape.id)
                return
            }
            case GEOMETRY_SHAPE_TYPES.OVAL: {
                if (drawingPhaseRef.current === 0) {
                    applyShapeUpdate(shape.id, {
                        center: point,
                        halfWidthNm: 0,
                        halfHeightNm: 0,
                    })
                    drawingPhaseRef.current = 1
                    return
                }

                const {halfWidthNm, halfHeightNm} = deriveAxisAlignedHalfExtentsNm(params.center, point)

                applyShapeUpdate(shape.id, {halfWidthNm, halfHeightNm})
                finalizeShapeIfComplete(shape.id)
                return
            }
            case GEOMETRY_SHAPE_TYPES.RACETRACK: {
                if (drawingPhaseRef.current === 0) {
                    applyShapeUpdate(shape.id, {
                        center1: point,
                        center2: null,
                        radiusNm: 0,
                    })
                    drawingPhaseRef.current = 1
                    return
                }

                if (drawingPhaseRef.current === 1) {
                    applyShapeUpdate(shape.id, {
                        center2: point,
                        radiusNm: 0,
                    })
                    racetrackPreviewLngLatRef.current = null
                    drawingPhaseRef.current = 2
                    return
                }

                if (drawingPhaseRef.current === 2) {
                    if (!params.center1 || !params.center2) {
                        return
                    }

                    const radiusNm = Math.min(
                        deriveRacetrackRadiusNm(params.center1, params.center2, point),
                        getRacetrackMaxRadiusNm(params.center1, params.center2),
                    )

                    applyShapeUpdate(shape.id, {radiusNm})
                    finalizeShapeIfComplete(shape.id)
                }
                return
            }
            case GEOMETRY_SHAPE_TYPES.POLYGON:
                if (mapPoint) {
                    handlePolygonClick(shape, point, mapPoint)
                }
                return
            default:
                return
        }
    }, [
        applyShapeUpdate,
        finalizeShapeIfComplete,
        getShapeById,
        handlePolygonClick,
        mapRef,
    ])

    const handlePointerMovePreview = useCallback((lngLat) => {
        const shapeId = activeShapeIdRef.current
        const shape = shapeId ? getShapeById(shapeId) : null

        if (!shape || shape.status === GEOMETRY_STATUS.COMMITTED) {
            return
        }

        const point = normalizeLngLat(lngLat)

        if (!point) {
            return
        }

        const params = getShapeById(shape.id)?.params ?? shape.params

        switch (shape.type) {
            case GEOMETRY_SHAPE_TYPES.RECTANGLE:
                if (params.center && drawingPhaseRef.current >= 1) {
                    const {halfWidthNm, halfHeightNm} = deriveAxisAlignedHalfExtentsNm(params.center, point)

                    applyShapeUpdate(shape.id, {halfWidthNm, halfHeightNm})
                }
                break
            case GEOMETRY_SHAPE_TYPES.SQUARE:
                if (params.center && drawingPhaseRef.current >= 1) {
                    applyShapeUpdate(shape.id, {
                        halfSizeNm: deriveSquareHalfSizeNm(params.center, point),
                    })
                }
                break
            case GEOMETRY_SHAPE_TYPES.CIRCLE:
                if (params.center && drawingPhaseRef.current >= 1) {
                    applyShapeUpdate(shape.id, {
                        radiusNm: deriveCircleRadiusNm(params.center, point),
                    })
                }
                break
            case GEOMETRY_SHAPE_TYPES.OVAL:
                if (params.center && drawingPhaseRef.current >= 1) {
                    const {halfWidthNm, halfHeightNm} = deriveAxisAlignedHalfExtentsNm(params.center, point)

                    applyShapeUpdate(shape.id, {halfWidthNm, halfHeightNm})
                }
                break
            case GEOMETRY_SHAPE_TYPES.RACETRACK:
                if (drawingPhaseRef.current === 1 && params.center1) {
                    racetrackPreviewLngLatRef.current = point
                    redrawPreview()
                } else if (drawingPhaseRef.current === 2 && params.center1 && params.center2) {
                    applyShapeUpdate(shape.id, {
                        radiusNm: Math.min(
                            deriveRacetrackRadiusNm(params.center1, params.center2, point),
                            getRacetrackMaxRadiusNm(params.center1, params.center2),
                        ),
                    })
                }
                break
            case GEOMETRY_SHAPE_TYPES.POLYGON:
                polygonPreviewLngLatRef.current = point
                redrawPreview()
                break
            default:
                break
        }
    }, [applyShapeUpdate, getShapeById, redrawPreview])

    const cancelDrawing = useCallback(() => {
        cancelPendingShape()
        resetDrawingPhase()
        clearPreview()
        onDrawingCancelled?.()
    }, [cancelPendingShape, clearPreview, onDrawingCancelled, resetDrawingPhase])

    const completePolygon = useCallback(() => {
        const shapeId = activeShapeIdRef.current
        const shape = shapeId ? getShapeById(shapeId) : null

        if (!shape || shape.type !== GEOMETRY_SHAPE_TYPES.POLYGON) {
            return
        }

        const vertices = shape.params.vertices ?? []

        if (vertices.length < 2) {
            return
        }

        applyShapeUpdate(shape.id, {
            vertices,
            closed: false,
            finalized: true,
        })
        finalizeShapeIfComplete(shape.id)
    }, [applyShapeUpdate, finalizeShapeIfComplete, getShapeById])

    useEffect(() => {
        const shape = activeShapeId ? getShapeById(activeShapeId) : null

        if (!shape || shape.status !== GEOMETRY_STATUS.PENDING) {
            resetDrawingInteraction()
            return
        }

        drawingPhaseRef.current = deriveDrawingPhaseForShape(shape)
        polygonPreviewLngLatRef.current = null
        racetrackPreviewLngLatRef.current = null
        setIsDrawingGeometry(false)
    }, [activeShapeId, getShapeById, resetDrawingInteraction])

    useEffect(() => {
        if (!enabled || !activeShapeId) {
            resetDrawingPhase()
        }
    }, [activeShapeId, enabled, resetDrawingPhase])

    useEffect(() => {
        if (!isPendingDrawMode()) {
            clearDrawGeometryCursor()
        }
    }, [clearDrawGeometryCursor, isPendingDrawMode, shapes, activeShapeId])

    useEffect(() => {
        if (!enabled) {
            return
        }

        appliedColorsRef.current = null
        syncMapAndPreview()
    }, [enabled, shapes, themeMode, syncMapAndPreview])

    useEffect(() => {
        if (!enabled || !mapRef.current) {
            return
        }

        const map = mapRef.current

        const handleStyleLoad = () => {
            const strokeColor = getStrokeColor(themeModeRef.current)
            const fillColor = getFillColor(themeModeRef.current)
            const textHaloColor = themeModeRef.current === 'dark' ? '#111111' : '#ffffff'

            void rehydrateDrawGeometryShapes(
                map,
                getRenderableShapes(),
                strokeColor,
                fillColor,
                textHaloColor,
                appliedColorsRef,
            )
            ensurePreviewOverlay()
        }

        const handleViewChange = () => {
            redrawPreview()
        }

        map.on('style.load', handleStyleLoad)
        map.on('resize', handleViewChange)
        map.on('move', handleViewChange)
        map.on('zoom', handleViewChange)

        handleStyleLoad()

        return () => {
            map.off('style.load', handleStyleLoad)
            map.off('resize', handleViewChange)
            map.off('move', handleViewChange)
            map.off('zoom', handleViewChange)
        }
    }, [
        enabled,
        ensurePreviewOverlay,
        getFillColor,
        getRenderableShapes,
        getStrokeColor,
        mapRef,
        redrawPreview,
    ])

    useEffect(() => () => {
        clearPreview()
    }, [clearPreview])

    useEffect(() => {
        if (!enabled || !mapRef.current) {
            return
        }

        const map = mapRef.current
        const canvas = map.getCanvas()

        const getMapPoint = (event) => {
            const bounds = canvas.getBoundingClientRect()

            return {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            }
        }

        const getLngLatFromMouseEvent = (event) => {
            const bounds = canvas.getBoundingClientRect()
            const x = event.clientX - bounds.left
            const y = event.clientY - bounds.top
            const lngLat = map.unproject([x, y])

            return {
                lngLat: {
                    lat: lngLat.lat,
                    lng: lngLat.lng,
                },
                mapPoint: {x, y},
            }
        }

        const handleDrawMouseDown = (event) => {
            if (event.defaultPrevented || event.button !== 0) {
                return
            }

            const shape = activeShapeIdRef.current ? getShapeById(activeShapeIdRef.current) : null

            if (!shape || shape.status === GEOMETRY_STATUS.COMMITTED) {
                return
            }

            event.preventDefault()
            event.stopPropagation()

            const {lngLat, mapPoint} = getLngLatFromMouseEvent(event)

            handleMapDrawClick(lngLat, mapPoint)
        }

        const handleMouseMove = (event) => {
            const mapPoint = {
                x: event.point.x,
                y: event.point.y,
            }

            updateMapCursorForPointer(mapPoint)

            const shape = activeShapeIdRef.current ? getShapeById(activeShapeIdRef.current) : null

            if (!shape || shape.status === GEOMETRY_STATUS.COMMITTED) {
                return
            }

            handlePointerMovePreview(event.lngLat)
        }

        const handleMouseLeave = () => {
            clearDrawGeometryCursor()
            clearGeometryHoverCursor()
        }

        const handlePrimarySelect = (event) => {
            if (isPendingDrawMode() || event.defaultPrevented) {
                return
            }

            const mapPoint = getMapPoint(event.originalEvent)
            const shape = getDrawGeometryShapeAtMapPoint(
                map,
                mapPoint,
                shapesRef.current,
                GEOMETRY_HIT_TEST_PIXEL_RADIUS,
            )

            if (shape) {
                onShapePrimaryClick?.(shape, {
                    x: mapPoint.x,
                    y: mapPoint.y,
                    lngLat: event.lngLat,
                })
            }
        }

        map.on('click', handlePrimarySelect)
        map.on('mousemove', handleMouseMove)
        map.on('mouseleave', handleMouseLeave)
        canvas.addEventListener('mousedown', handleDrawMouseDown, true)

        return () => {
            map.off('click', handlePrimarySelect)
            map.off('mousemove', handleMouseMove)
            map.off('mouseleave', handleMouseLeave)
            canvas.removeEventListener('mousedown', handleDrawMouseDown, true)
            clearDrawGeometryCursor()
            clearGeometryHoverCursor()
        }
    }, [
        clearDrawGeometryCursor,
        clearGeometryHoverCursor,
        enabled,
        getShapeById,
        handleMapDrawClick,
        handlePointerMovePreview,
        isPendingDrawMode,
        mapRef,
        onShapePrimaryClick,
        updateMapCursorForPointer,
    ])

    useEffect(() => {
        if (!enabled) {
            return
        }

        const handleKeyDown = (event) => {
            if (isKeyboardCustodyActiveRef.current?.()) {
                return
            }
            const bindings = bindingsRef.current

            if (keyMatchesBinding(event.key, bindings.cancelButton)) {
                event.preventDefault()
                cancelDrawing()
                return
            }

            if (keyMatchesBinding(event.key, bindings.completePolygonButton)) {
                event.preventDefault()
                completePolygon()
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [cancelDrawing, completePolygon, enabled])

    const removeGeometryShape = useCallback((shapeId) => {
        deleteShape(shapeId)
        syncMapAndPreview()
    }, [deleteShape, syncMapAndPreview])

    return {
        isDrawingGeometry,
        removeGeometryShape,
        cancelDrawing,
        completePolygon,
        syncMapAndPreview,
    }
}
