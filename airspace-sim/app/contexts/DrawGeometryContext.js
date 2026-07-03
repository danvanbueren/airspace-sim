'use client'

import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react'
import {ACTION_PANEL_ITEM_IDS} from '@/app/tools/actionPanels/actionPanelRegistry'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {
    createDefaultFillColorsByMode,
    createDefaultStrokeColorsByMode,
    getStrokeColorForMode,
} from '@/app/tools/map/drawGeometry/drawGeometryColor'
import {convertGeometryShapeType} from '@/app/tools/map/drawGeometry/drawGeometryConversion'
import {clampGeometryParamsToMapBounds} from '@/app/tools/map/drawGeometry/drawGeometryGeometry'
import {
    cloneGeometryShape,
    createDefaultParamsForType,
    createGeometryShape,
    isGeometryShapeInPendingDrawStatus,
    shouldAutoCommitPendingGeometryShape,
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
    const [defaultFillOpacity, setDefaultFillOpacity] = useState(0.2)
    const [isLoaded, setIsLoaded] = useState(false)

    const {appSettings} = useAppSettings()
    const persistDrawGeometry = appSettings.persistDrawGeometry

    const shapesRef = useRef(shapes)
    shapesRef.current = shapes
    const activeShapeIdRef = useRef(activeShapeId)
    activeShapeIdRef.current = activeShapeId
    const geometryWindowOpenerRef = useRef(null)

    const syncShapesRef = useCallback((nextShapes) => {
        shapesRef.current = nextShapes

        return nextShapes
    }, [])

    const hasHydratedRef = useRef(false)
    const prevPersistRef = useRef(undefined)

    // 1. Initial hydration on mount if persistence is enabled
    useEffect(() => {
        if (persistDrawGeometry && !hasHydratedRef.current) {
            hasHydratedRef.current = true
            setIsLoaded(true)
            try {
                const storedShapes = localStorage.getItem('drawGeometryShapes')
                if (storedShapes) {
                    const parsed = JSON.parse(storedShapes)
                    if (Array.isArray(parsed)) {
                        setShapes(syncShapesRef(parsed))
                    }
                }
                const storedStroke = localStorage.getItem('drawGeometryStrokeColors')
                if (storedStroke) {
                    setStrokeColorsByMode(JSON.parse(storedStroke))
                }
                const storedFill = localStorage.getItem('drawGeometryFillColors')
                if (storedFill) {
                    setFillColorsByMode(JSON.parse(storedFill))
                }
                const storedOpacity = localStorage.getItem('drawGeometryDefaultFillOpacity')
                if (storedOpacity) {
                    setDefaultFillOpacity(Number(storedOpacity))
                }
            } catch (e) {
                console.error('Failed to load persisted geometry state', e)
            }
        }
    }, [persistDrawGeometry, syncShapesRef])

    // Mount indicator to mark loaded if settings don't request persistence
    useEffect(() => {
        setIsLoaded(true)
    }, [])

    // 2. Save changes to localStorage when shapes/settings change
    useEffect(() => {
        if (!isLoaded) {
            return
        }
        if (persistDrawGeometry) {
            try {
                localStorage.setItem('drawGeometryShapes', JSON.stringify(shapes))
                localStorage.setItem('drawGeometryStrokeColors', JSON.stringify(strokeColorsByMode))
                localStorage.setItem('drawGeometryFillColors', JSON.stringify(fillColorsByMode))
                localStorage.setItem('drawGeometryDefaultFillOpacity', String(defaultFillOpacity))
            } catch (e) {
                console.error('Failed to persist geometry state', e)
            }
        } else {
            // Only clear storage if the user explicitly turned off persistence during this session
            if (prevPersistRef.current === true) {
                try {
                    localStorage.removeItem('drawGeometryShapes')
                    localStorage.removeItem('drawGeometryStrokeColors')
                    localStorage.removeItem('drawGeometryFillColors')
                    localStorage.removeItem('drawGeometryDefaultFillOpacity')
                } catch (e) {
                    // Ignore
                }
            }
        }
        prevPersistRef.current = persistDrawGeometry
    }, [shapes, strokeColorsByMode, fillColorsByMode, defaultFillOpacity, persistDrawGeometry, isLoaded])

    const registerGeometryWindowOpener = useCallback((opener) => {
        geometryWindowOpenerRef.current = opener
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
                    ? clampGeometryParamsToMapBounds(shape.type, {
                        ...shape.params,
                        ...updates.params,
                    })
                    : shape.params,
            }

            if (shouldAutoCommitPendingGeometryShape(nextShape, activeShapeIdRef.current)) {
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

            try {
                return convertGeometryShapeType(shape, nextType)
            } catch {
                return {
                    ...shape,
                    type: nextType,
                    params: createDefaultParamsForType(nextType),
                }
            }
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

        const shape = createGeometryShape(geometryType, {
            existingShapes: shapesRef.current,
            strokeColorsByMode,
            fillColorsByMode,
            fillOpacity: defaultFillOpacity,
        })

        shapesRef.current = [...shapesRef.current.filter((entry) => entry.id !== shape.id), shape]
        upsertShape(shape)
        setActiveDrawToolItemId(drawToolItemId)
        setActiveShapeId(shape.id)
        geometryWindowOpenerRef.current?.(shape)

        return shape
    }, [cancelPendingShape, changeShapeType, getShapeById, upsertShape, strokeColorsByMode, fillColorsByMode, defaultFillOpacity])

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
        defaultFillOpacity,
        setStrokeColorsByMode,
        setFillColorsByMode,
        setDefaultFillOpacity,
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
        defaultFillOpacity,
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
