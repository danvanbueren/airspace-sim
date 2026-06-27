'use client'

import {useEffect, useRef} from 'react'
import {useWorkspaceViewportContext} from '@/app/contexts/WorkspaceViewportContext'

export function useMapResize(mapRef, enabled) {
    const {isResizing, resizeGeneration} = useWorkspaceViewportContext()
    const mapRefStable = useRef(mapRef)
    mapRefStable.current = mapRef

    useEffect(() => {
        if (!enabled || isResizing) {
            return undefined
        }

        mapRefStable.current.current?.resize()

        return undefined
    }, [enabled, isResizing, resizeGeneration])
}
