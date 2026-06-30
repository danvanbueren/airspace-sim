'use client'

import {useCallback, useState} from 'react'
import {edgeAnchorsEqual} from '@/app/tools/map/edgeAnchoredPosition'
import {
    DEFAULT_FLOATING_WINDOW_SPAWN_POSITION,
    getStaggeredFloatingWindowSpawnPosition,
} from '@/app/tools/map/mapFloatingWindowLayout'
import {GEOMETRY_STATUS, GEOMETRY_TYPE_TO_DRAW_TOOL_ITEM} from '@/app/tools/map/drawGeometry/drawGeometryTypes'

const DEFAULT_GEOMETRY_WINDOW_WIDTH = 300

export function useGeometryWindows({onOpenGeometryWindow} = {}) {
    const [geometryWindows, setGeometryWindows] = useState([])

    const openGeometryWindow = useCallback((shape, position = null) => {
        if (!shape) {
            return null
        }

        let openedWindow = null

        setGeometryWindows((currentWindows) => {
            const existingWindow = currentWindows.find((window) => window.shapeId === shape.id)

            if (existingWindow) {
                openedWindow = existingWindow
                return currentWindows
            }

            const spawnPosition = getStaggeredFloatingWindowSpawnPosition(currentWindows, {
                x: position?.x ?? DEFAULT_FLOATING_WINDOW_SPAWN_POSITION.x,
                y: position?.y ?? DEFAULT_FLOATING_WINDOW_SPAWN_POSITION.y,
            })

            const geometryWindow = {
                id: crypto.randomUUID(),
                shapeId: shape.id,
                x: spawnPosition.x,
                y: spawnPosition.y,
                positionAnchor: position?.positionAnchor ?? null,
            }

            openedWindow = geometryWindow

            return [...currentWindows, geometryWindow]
        })

        if (openedWindow) {
            onOpenGeometryWindow?.(openedWindow)
        }

        return openedWindow
    }, [onOpenGeometryWindow])

    const closeGeometryWindow = useCallback((windowId) => {
        setGeometryWindows((currentWindows) => (
            currentWindows.filter((window) => window.id !== windowId)
        ))
    }, [])

    const closeGeometryWindowsForShape = useCallback((shapeId) => {
        setGeometryWindows((currentWindows) => (
            currentWindows.filter((window) => window.shapeId !== shapeId)
        ))
    }, [])

    const updateGeometryWindow = useCallback((windowId, updates) => {
        setGeometryWindows((currentWindows) => currentWindows.map((geometryWindow) => {
            if (geometryWindow.id !== windowId) {
                return geometryWindow
            }

            return {
                ...geometryWindow,
                ...updates,
            }
        }))
    }, [])

    const setGeometryWindowPositionAnchor = useCallback((windowId, positionAnchor) => {
        setGeometryWindows((currentWindows) => currentWindows.map((geometryWindow) => {
            if (geometryWindow.id !== windowId) {
                return geometryWindow
            }

            if (edgeAnchorsEqual(geometryWindow.positionAnchor, positionAnchor)) {
                return geometryWindow
            }

            return {
                ...geometryWindow,
                positionAnchor,
            }
        }))
    }, [])

    const openGeometryWindowForShape = useCallback((shape, elementContainer) => {
        const drawToolItemId = GEOMETRY_TYPE_TO_DRAW_TOOL_ITEM[shape.type]

        return openGeometryWindow(shape, {
            x: elementContainer?.x ?? DEFAULT_FLOATING_WINDOW_SPAWN_POSITION.x,
            y: elementContainer?.y ?? DEFAULT_FLOATING_WINDOW_SPAWN_POSITION.y,
            drawToolItemId,
        })
    }, [openGeometryWindow])

    const syncGeometryWindowsAfterShapeDelete = useCallback((shapeId) => {
        closeGeometryWindowsForShape(shapeId)
    }, [closeGeometryWindowsForShape])

    const getGeometryWindowForShape = useCallback((shapeId) => (
        geometryWindows.find((window) => window.shapeId === shapeId) ?? null
    ), [geometryWindows])

    return {
        geometryWindows,
        openGeometryWindow,
        openGeometryWindowForShape,
        closeGeometryWindow,
        closeGeometryWindowsForShape,
        updateGeometryWindow,
        setGeometryWindowPositionAnchor,
        syncGeometryWindowsAfterShapeDelete,
        getGeometryWindowForShape,
        geometryWindowWidth: DEFAULT_GEOMETRY_WINDOW_WIDTH,
    }
}

export function geometryWindowShouldShowPendingPill(shape) {
    return shape?.status === GEOMETRY_STATUS.PENDING
}
