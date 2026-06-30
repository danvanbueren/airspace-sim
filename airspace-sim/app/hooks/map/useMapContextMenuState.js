'use client'

import {useCallback, useEffect, useState} from 'react'

export function createMapContextMenuElement({point, lngLat, line, track, geometry}) {
    return {
        x: point.x,
        y: point.y,
        lngLat,
        line,
        track: track ?? null,
        geometry: geometry ?? null,
    }
}

export function useMapContextMenuState(contextMenuRef) {
    const [currentContextMenuElement, setCurrentContextMenuElement] = useState(null)

    const openBearingRangeContextMenu = useCallback(({point, lngLat, line, track, geometry}) => {
        setCurrentContextMenuElement(createMapContextMenuElement({
            point,
            lngLat,
            line,
            track,
            geometry,
        }))
    }, [])

    const closeContextMenu = useCallback(() => {
        setCurrentContextMenuElement(null)
    }, [])

    useEffect(() => {
        if (!currentContextMenuElement) return

        const handlePointerDown = (event) => {
            if (contextMenuRef.current?.contains(event.target)) return

            setCurrentContextMenuElement(null)
        }

        document.addEventListener('pointerdown', handlePointerDown)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
        }
    }, [currentContextMenuElement, contextMenuRef])

    return {
        currentContextMenuElement,
        openBearingRangeContextMenu,
        closeContextMenu,
    }
}