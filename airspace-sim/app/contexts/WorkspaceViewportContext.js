'use client'

import {createContext, useContext, useMemo} from 'react'
import {useWorkspaceViewport} from '@/app/hooks/map/useWorkspaceViewport'

const WorkspaceViewportContext = createContext(null)

export function WorkspaceViewportProvider({containerRef, children}) {
    const viewport = useWorkspaceViewport(containerRef)

    const value = useMemo(() => ({
        containerRef,
        size: viewport.size,
        isResizing: viewport.isResizing,
        resizeGeneration: viewport.resizeGeneration,
        resizeLayoutTick: viewport.resizeLayoutTick,
    }), [
        containerRef,
        viewport.isResizing,
        viewport.resizeGeneration,
        viewport.resizeLayoutTick,
        viewport.size,
    ])

    return (
        <WorkspaceViewportContext.Provider value={value}>
            {children}
        </WorkspaceViewportContext.Provider>
    )
}

export function useWorkspaceViewportContext() {
    const context = useContext(WorkspaceViewportContext)

    if (!context) {
        throw new Error('useWorkspaceViewportContext must be used inside WorkspaceViewportProvider')
    }

    return context
}
