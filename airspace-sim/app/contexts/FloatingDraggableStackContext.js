'use client'

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import {getDraggableFloatingZIndex} from '@/app/constants/uiZIndex'

const FloatingDraggableStackContext = createContext(null)

export function FloatingDraggableStackProvider({children}) {
    const [focusOrder, setFocusOrder] = useState([])

    const registerDraggable = useCallback((draggableId) => {
        if (!draggableId) {
            return
        }

        setFocusOrder((currentOrder) => (
            currentOrder.includes(draggableId)
                ? currentOrder
                : [...currentOrder, draggableId]
        ))
    }, [])

    const unregisterDraggable = useCallback((draggableId) => {
        if (!draggableId) {
            return
        }

        setFocusOrder((currentOrder) => currentOrder.filter((id) => id !== draggableId))
    }, [])

    const bringDraggableToFront = useCallback((draggableId) => {
        if (!draggableId) {
            return
        }

        setFocusOrder((currentOrder) => (
            [...currentOrder.filter((id) => id !== draggableId), draggableId]
        ))
    }, [])

    const getDraggableZIndex = useCallback((draggableId) => {
        const stackIndex = focusOrder.indexOf(draggableId)

        return getDraggableFloatingZIndex(stackIndex >= 0 ? stackIndex : 0)
    }, [focusOrder])

    const value = useMemo(() => ({
        registerDraggable,
        unregisterDraggable,
        bringDraggableToFront,
        getDraggableZIndex,
    }), [
        registerDraggable,
        unregisterDraggable,
        bringDraggableToFront,
        getDraggableZIndex,
    ])

    return (
        <FloatingDraggableStackContext.Provider value={value}>
            {children}
        </FloatingDraggableStackContext.Provider>
    )
}

export function useFloatingDraggableStack() {
    const context = useContext(FloatingDraggableStackContext)

    if (!context) {
        throw new Error('useFloatingDraggableStack must be used inside FloatingDraggableStackProvider')
    }

    return context
}
