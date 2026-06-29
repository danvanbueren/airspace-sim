'use client'

import {createContext, useCallback, useContext, useMemo, useState} from 'react'
import {computeDrawToolsPanelPosition} from '@/app/tools/actionPanels/drawToolsActionPanel'

const DrawToolsContext = createContext(null)

export function DrawToolsProvider({children}) {
    const [drawToolsState, setDrawToolsState] = useState({
        isOpen: false,
        layout: null,
    })

    const closeDrawTools = useCallback(() => {
        setDrawToolsState({
            isOpen: false,
            layout: null,
        })
    }, [])

    const openDrawTools = useCallback((elementContainer, mapContainerRef) => {
        if (!elementContainer) {
            return
        }

        const layout = computeDrawToolsPanelPosition(elementContainer, mapContainerRef)

        setDrawToolsState({
            isOpen: true,
            layout,
        })
    }, [])

    const updateDrawToolsLayout = useCallback((layoutUpdates) => {
        setDrawToolsState((currentState) => {
            if (!currentState.isOpen || !currentState.layout) {
                return currentState
            }

            return {
                ...currentState,
                layout: {
                    ...currentState.layout,
                    ...layoutUpdates,
                    anchor: layoutUpdates.anchor ?? currentState.layout.anchor,
                },
            }
        })
    }, [])

    const value = useMemo(() => ({
        drawToolsState,
        openDrawTools,
        closeDrawTools,
        updateDrawToolsLayout,
    }), [closeDrawTools, drawToolsState, openDrawTools, updateDrawToolsLayout])

    return (
        <DrawToolsContext.Provider value={value}>
            {children}
        </DrawToolsContext.Provider>
    )
}

export function useDrawTools() {
    const context = useContext(DrawToolsContext)

    if (!context) {
        throw new Error('useDrawTools must be used inside DrawToolsProvider')
    }

    return context
}
