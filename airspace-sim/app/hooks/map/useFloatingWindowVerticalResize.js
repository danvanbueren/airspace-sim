'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {MAP_FLOATING_WINDOW_EDGE_PADDING} from '@/app/constants/mapFloatingWindows'

const DEFAULT_MIN_WINDOW_HEIGHT_PX = 200

function clampWindowHeight(height, minHeight, maxHeight) {
    return Math.min(maxHeight, Math.max(minHeight, Math.round(height)))
}

export function useFloatingWindowVerticalResize({
    windowRef,
    mapContainerRef,
    interactionsEnabled = true,
    storedHeight = null,
    minHeight = DEFAULT_MIN_WINDOW_HEIGHT_PX,
    maxHeight,
    onHeightCommit,
}) {
    const resizeStateRef = useRef(null)
    const [height, setHeight] = useState(
        typeof storedHeight === 'number' ? storedHeight : null,
    )

    useEffect(() => {
        if (typeof storedHeight === 'number') {
            setHeight(storedHeight)
        }
    }, [storedHeight])

    const resolveMaxHeight = useCallback(() => {
        if (typeof maxHeight === 'number') {
            return maxHeight
        }

        const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight

        return Math.max(minHeight, containerHeight - MAP_FLOATING_WINDOW_EDGE_PADDING * 2)
    }, [mapContainerRef, maxHeight, minHeight])

    const handleResizeHandlePointerDown = useCallback((event) => {
        if (!interactionsEnabled || event.button !== 0) {
            return
        }

        event.stopPropagation()
        event.preventDefault()

        const windowElement = windowRef.current

        if (!windowElement) {
            return
        }

        resizeStateRef.current = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startHeight: windowElement.offsetHeight,
        }

        event.currentTarget.setPointerCapture?.(event.pointerId)
    }, [interactionsEnabled, windowRef])

    const handleResizeHandlePointerMove = useCallback((event) => {
        const resizeState = resizeStateRef.current

        if (!resizeState || resizeState.pointerId !== event.pointerId) {
            return
        }

        event.preventDefault()
        event.stopPropagation()

        const deltaY = event.clientY - resizeState.startY
        const nextHeight = clampWindowHeight(
            resizeState.startHeight + deltaY,
            minHeight,
            resolveMaxHeight(),
        )

        setHeight(nextHeight)
    }, [minHeight, resolveMaxHeight])

    const handleResizeHandlePointerUp = useCallback((event) => {
        if (resizeStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        resizeStateRef.current = null

        const committedHeight = clampWindowHeight(
            height ?? minHeight,
            minHeight,
            resolveMaxHeight(),
        )

        setHeight(committedHeight)
        onHeightCommit?.(committedHeight)
    }, [height, minHeight, onHeightCommit, resolveMaxHeight])

    return {
        height,
        handleResizeHandlePointerDown,
        handleResizeHandlePointerMove,
        handleResizeHandlePointerUp,
    }
}
