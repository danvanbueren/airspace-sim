'use client'

import {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react'
import {ACTION_PANEL_ITEM_IDS} from '@/app/tools/actionPanels/actionPanelRegistry'
import {
    createDefaultFillColorsByMode,
    createDefaultStrokeColorsByMode,
    getStrokeColorForMode,
} from '@/app/tools/map/drawGeometry/drawGeometryColor'
import {convertGeometryShapeType} from '@/app/tools/map/drawGeometry/drawGeometryConversion'
import {
    cloneGeometryShape,
    createGeometryShape,
    isGeometryShapeComplete,
    isGeometryShapeInPendingDrawStatus,
} from '@/app/tools/map/drawGeometry/drawGeometryModels'
import {
    DRAW_TOOL_ITEM_TO_GEOMETRY_TYPE,
    GEOMETRY_SHAPE_TYPES,
    GEOMETRY_STATUS,
    GEOMETRY_TYPE_TO_DRAW_TOOL_ITEM,
} from '@/app/tools/map/drawGeometry/drawGeometryTypes'

const DrawGeometryContext = createContext(null)

export function DrawGeometryProvider({children}) {
    const [shapes, setShapes] = useState([])
    const [activeDrawToolItemId, setActiveDrawToolItemId] = useState(null)
    const [activeShapeId, setActiveShapeId] = useState(null)
    const [strokeColorsByMode, setStrokeColorsByMode] = useState(createDefaultStrokeColorsByMode)
    const [fillColorsByMode, setFillColorsByMode] = useState(createDefaultFillColorsByMode)

    const shapesRef = useRef(shapes)
    shapesRef.current = shapes
    const geometryWindowOpenerRef = useRef(null)

    const registerGeometryWindowOpener = useCallback((opener) => {
        geometryWindowOpenerRef.current = opener
    }, [])

    const syncShapesRef = useCallback((nextShapes) => {
        shapesRef.current = nextShapes

        return nextShapes
    }, [])

    const clearDrawSession = useCallback(() => {
        setActiveDrawToolItemId(null)
        setActiveShapeId(null)
    }, [])

    const endDrawSessionForCommittedShape = useCallback((shapeId) => {
        setActiveShapeId((currentShapeId) => {
            if (currentShapeId === shapeId) {
                setActiveDrawToolItemId(null)
                return null
            }

            return currentShapeId
        })
    }, [])

    const upsertShape = useCallback((nextShape) => {
        setShapes((currentShapes) => {
            const existingIndex = currentShapes.findIndex((shape) => shape.id === nextShape.id)

            if (existingIndex === -1) {
                return syncShapesRef([...currentShapes, nextShape])
            }

            const updatedShapes = [...currentShapes]
            updatedShapes[existingIndex] = nextShape

            return syncShapesRef(updatedShapes)
        })
    }, [syncShapesRef])

    const updateShape = useCallback((shapeId, updates) => {
        const currentShape = shapesRef.current.find((shape) => shape.id === shapeId)
        let didCommit = false

        setShapes((currentShapes) => syncShapesRef(currentShapes.map((shape) => {
            if (shape.id !== shapeId) {
                return shape
            }

            const nextShape = {
                ...shape,
                ...updates,
                params: updates.params
                    ? {...shape.params, ...updates.params}
                    : shape.params,
            }

            if (isGeometryShapeComplete(nextShape) && nextShape.status === GEOMETRY_STATUS.PENDING) {
                if (nextShape.type !== GEOMETRY_SHAPE_TYPES.POLYGON || nextShape.params.finalized) {
                    nextShape.status = GEOMETRY_STATUS.COMMITTED
                }
            }

            if (
                currentShape?.status === GEOMETRY_STATUS.PENDING
                && nextShape.status === GEOMETRY_STATUS.COMMITTED
            ) {
                didCommit = true
            }

            return nextShape
        })))

        if (didCommit) {
            endDrawSessionForCommittedShape(shapeId)
        }
    }, [endDrawSessionForCommittedShape, syncShapesRef])

    const deleteShape = useCallback((shapeId) => {
        setShapes((currentShapes) => syncShapesRef(
            currentShapes.filter((shape) => shape.id !== shapeId),
        ))

        setActiveShapeId((currentShapeId) => {
            if (currentShapeId === shapeId) {
                setActiveDrawToolItemId(null)
                return null
            }

            return currentShapeId
        })
    }, [syncShapesRef])

    const commitShape = useCallback((shapeId) => {
        updateShape(shapeId, {status: GEOMETRY_STATUS.COMMITTED})
    }, [updateShape])

    const cancelPendingShape = useCallback(() => {
        const pendingShape = shapesRef.current.find((shape) => (
            isGeometryShapeInPendingDrawStatus(shape)
        ))

        if (pendingShape) {
            deleteShape(pendingShape.id)
            return
        }

        clearDrawSession()
    }, [clearDrawSession, deleteShape])

    const getShapeById = useCallback((shapeId) => (
        shapesRef.current.find((shape) => shape.id === shapeId) ?? null
    ), [])

    const changeShapeType = useCallback((shapeId, nextDrawToolItemId) => {
        const nextType = DRAW_TOOL_ITEM_TO_GEOMETRY_TYPE[nextDrawToolItemId]

        if (!nextType) {
            return
        }

        const currentShape = shapesRef.current.find((shape) => shape.id === shapeId)
        const isPendingDrawShape = isGeometryShapeInPendingDrawStatus(currentShape)

        setShapes((currentShapes) => syncShapesRef(currentShapes.map((shape) => {
            if (shape.id !== shapeId) {
                return shape
            }

            return convertGeometryShapeType(shape, nextType)
        })))

        if (isPendingDrawShape) {
            setActiveDrawToolItemId(nextDrawToolItemId)
            setActiveShapeId(shapeId)
        }
    }, [syncShapesRef])

    const startDrawTool = useCallback((drawToolItemId) => {
        const geometryType = DRAW_TOOL_ITEM_TO_GEOMETRY_TYPE[drawToolItemId]

        if (!geometryType) {
            return null
        }

        const existingPending = shapesRef.current.find((shape) => (
            isGeometryShapeInPendingDrawStatus(shape)
        ))

        if (existingPending) {
            const existingDrawToolItemId = GEOMETRY_TYPE_TO_DRAW_TOOL_ITEM[existingPending.type]

            if (existingDrawToolItemId === drawToolItemId) {
                cancelPendingShape()

                return null
            }

            changeShapeType(existingPending.id, drawToolItemId)
            setActiveShapeId(existingPending.id)
            geometryWindowOpenerRef.current?.(getShapeById(existingPending.id) ?? existingPending)

            return getShapeById(existingPending.id) ?? existingPending
        }

        const shape = createGeometryShape(geometryType)

        shapesRef.current = [...shapesRef.current.filter((entry) => entry.id !== shape.id), shape]
        upsertShape(shape)
        setActiveDrawToolItemId(drawToolItemId)
        setActiveShapeId(shape.id)
        geometryWindowOpenerRef.current?.(shape)

        return shape
    }, [cancelPendingShape, changeShapeType, getShapeById, upsertShape])

    const getStrokeColor = useCallback((mode) => (
        getStrokeColorForMode(strokeColorsByMode, mode)
    ), [strokeColorsByMode])

    const getFillColor = useCallback((mode) => (
        getStrokeColorForMode(fillColorsByMode, mode)
    ), [fillColorsByMode])

    const value = useMemo(() => ({
        shapes,
        activeDrawToolItemId,
        activeShapeId,
        strokeColorsByMode,
        fillColorsByMode,
        setStrokeColorsByMode,
        setFillColorsByMode,
        upsertShape,
        updateShape,
        deleteShape,
        commitShape,
        cancelPendingShape,
        startDrawTool,
        changeShapeType,
        setActiveDrawToolItemId,
        setActiveShapeId,
        getShapeById,
        getStrokeColor,
        getFillColor,
        cloneGeometryShape,
        registerGeometryWindowOpener,
        drawToolItemIds: [
            ACTION_PANEL_ITEM_IDS.DRAW_RECTANGLE,
            ACTION_PANEL_ITEM_IDS.DRAW_SQUARE,
            ACTION_PANEL_ITEM_IDS.DRAW_CIRCLE,
            ACTION_PANEL_ITEM_IDS.DRAW_OVAL,
            ACTION_PANEL_ITEM_IDS.DRAW_RACETRACK,
            ACTION_PANEL_ITEM_IDS.DRAW_POLYGON,
        ],
    }), [
        activeDrawToolItemId,
        activeShapeId,
        cancelPendingShape,
        changeShapeType,
        commitShape,
        deleteShape,
        fillColorsByMode,
        getFillColor,
        getShapeById,
        getStrokeColor,
        shapes,
        startDrawTool,
        registerGeometryWindowOpener,
        strokeColorsByMode,
        updateShape,
        upsertShape,
    ])

    return (
        <DrawGeometryContext.Provider value={value}>
            {children}
        </DrawGeometryContext.Provider>
    )
}

export function useDrawGeometry() {
    const context = useContext(DrawGeometryContext)

    if (!context) {
        throw new Error('useDrawGeometry must be used inside DrawGeometryProvider')
    }

    return context
}
