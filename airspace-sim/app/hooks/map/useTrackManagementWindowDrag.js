'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {MAP_FLOATING_WINDOW_EDGE_PADDING} from '@/app/constants/mapFloatingWindows'
import {
    absoluteToEdgeAnchor,
    resolveEdgeAnchoredPosition,
} from '@/app/tools/map/edgeAnchoredPosition'

const EDGE_PADDING = MAP_FLOATING_WINDOW_EDGE_PADDING
const DEFAULT_WINDOW_WIDTH = 300
const DEFAULT_WINDOW_HEIGHT = 320

function getContainerSize(mapContainerRef) {
    return {
        width: mapContainerRef.current?.clientWidth ?? window.innerWidth,
        height: mapContainerRef.current?.clientHeight ?? window.innerHeight,
    }
}

function getWindowSize(trackManagementWindowSize) {
    return {
        width: trackManagementWindowSize.width || DEFAULT_WINDOW_WIDTH,
        height: trackManagementWindowSize.height || DEFAULT_WINDOW_HEIGHT,
    }
}

function getTrackManagementWindowBounds(trackManagementWindowSize, mapContainerRef) {
    const containerSize = getContainerSize(mapContainerRef)
    const windowSize = getWindowSize(trackManagementWindowSize)

    return {
        minLeft: EDGE_PADDING,
        minTop: EDGE_PADDING,
        maxLeft: Math.max(EDGE_PADDING, containerSize.width - windowSize.width - EDGE_PADDING),
        maxTop: Math.max(EDGE_PADDING, containerSize.height - windowSize.height - EDGE_PADDING),
    }
}

export function getBoundedTrackManagementWindowPosition(left, top, trackManagementWindowSize, mapContainerRef) {
    const containerSize = getContainerSize(mapContainerRef)
    const windowSize = getWindowSize(trackManagementWindowSize)
    const bounds = getTrackManagementWindowBounds(trackManagementWindowSize, mapContainerRef)

    return resolveEdgeAnchoredPosition(
        absoluteToEdgeAnchor(left, top, containerSize, windowSize),
        containerSize,
        windowSize,
        bounds,
    )
}

export function getLegacyMapClickWindowPosition(trackManagementWindow, trackManagementWindowSize, mapContainerRef) {
    const containerSize = getContainerSize(mapContainerRef)
    const windowSize = getWindowSize(trackManagementWindowSize)

    let left = trackManagementWindow.x
    let top = trackManagementWindow.y

    if (left + windowSize.width > containerSize.width - EDGE_PADDING) {
        left = trackManagementWindow.x - windowSize.width
    }

    if (top + windowSize.height > containerSize.height - EDGE_PADDING) {
        top = trackManagementWindow.y - windowSize.height
    }

    return {
        left: Math.max(EDGE_PADDING, left),
        top: Math.max(EDGE_PADDING, top),
    }
}

export function getTrackManagementWindowPosition(trackManagementWindow, trackManagementWindowSize, mapContainerRef) {
    const containerSize = getContainerSize(mapContainerRef)
    const windowSize = getWindowSize(trackManagementWindowSize)

    if (trackManagementWindow.positionAnchor) {
        return resolveEdgeAnchoredPosition(
            trackManagementWindow.positionAnchor,
            containerSize,
            windowSize,
            getTrackManagementWindowBounds(trackManagementWindowSize, mapContainerRef),
        )
    }

    return getLegacyMapClickWindowPosition(
        trackManagementWindow,
        trackManagementWindowSize,
        mapContainerRef,
    )
}

function removeWindowPointerListeners(listeners) {
    if (!listeners) {
        return
    }

    window.removeEventListener('pointermove', listeners.move)
    window.removeEventListener('pointerup', listeners.end)
    window.removeEventListener('pointercancel', listeners.end)
}

export function useTrackManagementWindowDrag({
    mapContainerRef,
    onMoveComplete,
    onActivate,
    onClaimKeyboardCustody,
    windowId,
    trackManagementWindowSize,
    windowElementSelector = '[data-track-management-window]',
}) {
    const dragStateRef = useRef(null)
    const [dragPosition, setDragPosition] = useState(null)
    const trackManagementWindowSizeRef = useRef(trackManagementWindowSize)
    const onMoveCompleteRef = useRef(onMoveComplete)
    const mapContainerRefRef = useRef(mapContainerRef)
    const windowIdRef = useRef(windowId)

    trackManagementWindowSizeRef.current = trackManagementWindowSize
    onMoveCompleteRef.current = onMoveComplete
    mapContainerRefRef.current = mapContainerRef
    windowIdRef.current = windowId

    const stopWindowPointerTracking = useCallback(() => {
        removeWindowPointerListeners(dragStateRef.current?.windowListeners)
    }, [])

    const finishDrag = useCallback((event) => {
        const dragState = dragStateRef.current

        if (!dragState || dragState.pointerId !== event.pointerId) {
            return
        }

        if (dragState.captureTarget?.hasPointerCapture?.(event.pointerId)) {
            dragState.captureTarget.releasePointerCapture(event.pointerId)
        }

        stopWindowPointerTracking()
        dragStateRef.current = null

        setDragPosition((currentDragPosition) => {
            if (currentDragPosition) {
                const containerSize = getContainerSize(mapContainerRefRef.current)
                const windowSize = getWindowSize(trackManagementWindowSizeRef.current)

                onMoveCompleteRef.current?.(
                    windowIdRef.current,
                    absoluteToEdgeAnchor(
                        currentDragPosition.x,
                        currentDragPosition.y,
                        containerSize,
                        windowSize,
                    ),
                )
            }

            return null
        })
    }, [stopWindowPointerTracking])

    const updateDragPosition = useCallback((event) => {
        const dragState = dragStateRef.current

        if (!dragState || dragState.pointerId !== event.pointerId) {
            return
        }

        event.preventDefault()

        const left = event.clientX - dragState.containerLeft - dragState.offsetX
        const top = event.clientY - dragState.containerTop - dragState.offsetY
        const boundedPosition = getBoundedTrackManagementWindowPosition(
            left,
            top,
            trackManagementWindowSizeRef.current,
            mapContainerRefRef.current,
        )

        setDragPosition({
            x: boundedPosition.left,
            y: boundedPosition.top,
        })
    }, [])

    const handleHeaderPointerDown = useCallback((event) => {
        if (event.button !== 0) {
            return
        }

        event.stopPropagation()
        event.preventDefault()
        onActivate?.()
        onClaimKeyboardCustody?.(windowId)

        const trackManagementWindowElement = event.currentTarget.closest(windowElementSelector)
        const mapContainerElement = mapContainerRef.current

        if (!trackManagementWindowElement || !mapContainerElement) {
            return
        }

        const windowRect = trackManagementWindowElement.getBoundingClientRect()
        const containerRect = mapContainerElement.getBoundingClientRect()
        const captureTarget = event.currentTarget

        const windowListeners = {
            move: (moveEvent) => {
                updateDragPosition(moveEvent)
            },
            end: (endEvent) => {
                finishDrag(endEvent)
            },
        }

        dragStateRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - windowRect.left,
            offsetY: event.clientY - windowRect.top,
            containerLeft: containerRect.left,
            containerTop: containerRect.top,
            captureTarget,
            windowListeners,
        }

        captureTarget.setPointerCapture?.(event.pointerId)

        window.addEventListener('pointermove', windowListeners.move)
        window.addEventListener('pointerup', windowListeners.end)
        window.addEventListener('pointercancel', windowListeners.end)
    }, [
        finishDrag,
        mapContainerRef,
        onActivate,
        onClaimKeyboardCustody,
        updateDragPosition,
        windowElementSelector,
        windowId,
    ])

    useEffect(() => {
        return () => {
            stopWindowPointerTracking()
            dragStateRef.current = null
        }
    }, [stopWindowPointerTracking])

    return {
        dragPosition,
        handleHeaderPointerDown,
        handleHeaderPointerMove: updateDragPosition,
        handleHeaderPointerUp: finishDrag,
    }
}
