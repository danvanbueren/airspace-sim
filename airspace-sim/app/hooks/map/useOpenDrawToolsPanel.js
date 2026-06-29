'use client'

import {useCallback} from 'react'
import {useDrawTools} from '@/app/contexts/DrawToolsContext'
import {useFloatingDraggableStack} from '@/app/contexts/FloatingDraggableStackContext'
import {FLOATING_DRAGGABLE_IDS} from '@/app/constants/floatingDraggableIds'

export function useOpenDrawToolsPanel() {
    const {openDrawTools} = useDrawTools()
    const {bringDraggableToFront} = useFloatingDraggableStack()

    const openDrawToolsPanel = useCallback((elementContainer, mapContainerRef) => {
        openDrawTools(elementContainer, mapContainerRef)

        requestAnimationFrame(() => {
            bringDraggableToFront(FLOATING_DRAGGABLE_IDS.drawTools)
        })
    }, [bringDraggableToFront, openDrawTools])

    return {openDrawToolsPanel}
}
