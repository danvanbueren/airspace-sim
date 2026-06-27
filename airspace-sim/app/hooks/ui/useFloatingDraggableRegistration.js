'use client'

import {useCallback, useEffect} from 'react'
import {useFloatingDraggableStack} from '@/app/contexts/FloatingDraggableStackContext'

export function useFloatingDraggableRegistration(draggableId) {
    const {
        registerDraggable,
        unregisterDraggable,
        bringDraggableToFront,
        getDraggableZIndex,
    } = useFloatingDraggableStack()

    useEffect(() => {
        if (!draggableId) {
            return undefined
        }

        registerDraggable(draggableId)

        return () => {
            unregisterDraggable(draggableId)
        }
    }, [draggableId, registerDraggable, unregisterDraggable])

    const bringToFront = useCallback(() => {
        bringDraggableToFront(draggableId)
    }, [bringDraggableToFront, draggableId])

    const zIndex = getDraggableZIndex(draggableId)

    return {
        zIndex,
        bringToFront,
    }
}
