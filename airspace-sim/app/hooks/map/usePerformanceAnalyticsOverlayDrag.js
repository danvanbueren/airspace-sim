'use client'

import {useCallback, useLayoutEffect, useRef, useState} from 'react'
import {
    MAP_GLASS_INSET_PX,
    MAP_OVERLAY_DRAG_MIN_EDGE_PX,
    MAP_PERFORMANCE_OVERLAY_BOTTOM_PX,
} from '@/app/constants/mapUiLayout'

function getOverlaySize(overlayRef) {
    return {
        width: overlayRef.current?.offsetWidth ?? 0,
        height: overlayRef.current?.offsetHeight ?? 0,
    }
}

function getDefaultOverlayPosition(overlayRef, mapContainerRef) {
    const container = mapContainerRef.current
    const overlaySize = getOverlaySize(overlayRef)

    if (!container || overlaySize.width === 0 || overlaySize.height === 0) {
        return null
    }

    return {
        left: container.clientWidth - overlaySize.width - MAP_GLASS_INSET_PX,
        top: container.clientHeight - overlaySize.height - MAP_PERFORMANCE_OVERLAY_BOTTOM_PX,
    }
}

export function getBoundedPerformanceOverlayPosition(left, top, overlayRef, mapContainerRef) {
    const container = mapContainerRef.current
    const overlaySize = getOverlaySize(overlayRef)

    if (!container || overlaySize.width === 0 || overlaySize.height === 0) {
        return {left, top}
    }

    const maxLeft = Math.max(
        MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        container.clientWidth - overlaySize.width - MAP_GLASS_INSET_PX,
    )
    const maxTop = Math.max(
        MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        container.clientHeight - overlaySize.height - MAP_GLASS_INSET_PX,
    )

    return {
        left: Math.min(Math.max(MAP_OVERLAY_DRAG_MIN_EDGE_PX, left), maxLeft),
        top: Math.min(Math.max(MAP_OVERLAY_DRAG_MIN_EDGE_PX, top), maxTop),
    }
}

export function usePerformanceAnalyticsOverlayDrag({mapContainerRef, overlayRef, enabled}) {
    const [position, setPosition] = useState(null)
    const dragStateRef = useRef(null)
    const positionRef = useRef(null)

    positionRef.current = position

    const syncPositionToBounds = useCallback(() => {
        if (!positionRef.current) {
            return
        }

        setPosition((currentPosition) => {
            if (!currentPosition) {
                return currentPosition
            }

            return getBoundedPerformanceOverlayPosition(
                currentPosition.left,
                currentPosition.top,
                overlayRef,
                mapContainerRef,
            )
        })
    }, [mapContainerRef, overlayRef])

    useLayoutEffect(() => {
        if (!enabled) {
            setPosition(null)
            return
        }

        const defaultPosition = getDefaultOverlayPosition(overlayRef, mapContainerRef)

        if (defaultPosition) {
            setPosition(defaultPosition)
        }
    }, [enabled, mapContainerRef, overlayRef])

    useLayoutEffect(() => {
        if (!enabled || !mapContainerRef.current) {
            return
        }

        const container = mapContainerRef.current
        const resizeObserver = new ResizeObserver(() => {
            syncPositionToBounds()
        })

        resizeObserver.observe(container)

        if (overlayRef.current) {
            resizeObserver.observe(overlayRef.current)
        }

        return () => {
            resizeObserver.disconnect()
        }
    }, [enabled, mapContainerRef, overlayRef, syncPositionToBounds])

    const handlePanelPointerDown = useCallback((event) => {
        event.stopPropagation()
    }, [])

    const handleDragHandlePointerDown = useCallback((event) => {
        if (event.button !== 0) {
            return
        }

        event.stopPropagation()
        event.preventDefault()

        const overlayElement = event.currentTarget.closest('[data-performance-analytics-overlay]')
        const mapContainerElement = mapContainerRef.current

        if (!overlayElement || !mapContainerElement) {
            return
        }

        const overlayRect = overlayElement.getBoundingClientRect()
        const containerRect = mapContainerElement.getBoundingClientRect()

        dragStateRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - overlayRect.left,
            offsetY: event.clientY - overlayRect.top,
            containerLeft: containerRect.left,
            containerTop: containerRect.top,
        }

        event.currentTarget.setPointerCapture?.(event.pointerId)
    }, [mapContainerRef])

    const handleDragHandlePointerMove = useCallback((event) => {
        const dragState = dragStateRef.current

        if (!dragState || dragState.pointerId !== event.pointerId) {
            return
        }

        event.preventDefault()
        event.stopPropagation()

        const left = event.clientX - dragState.containerLeft - dragState.offsetX
        const top = event.clientY - dragState.containerTop - dragState.offsetY

        setPosition(getBoundedPerformanceOverlayPosition(
            left,
            top,
            overlayRef,
            mapContainerRef,
        ))
    }, [mapContainerRef, overlayRef])

    const handleDragHandlePointerUp = useCallback((event) => {
        if (dragStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        dragStateRef.current = null
    }, [])

    return {
        position,
        handlePanelPointerDown,
        handleDragHandlePointerDown,
        handleDragHandlePointerMove,
        handleDragHandlePointerUp,
    }
}
