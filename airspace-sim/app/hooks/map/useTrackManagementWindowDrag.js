'use client'

import {useCallback, useRef, useState} from 'react'
import {
    absoluteToEdgeAnchor,
    resolveEdgeAnchoredPosition,
} from '@/app/tools/map/edgeAnchoredPosition'

const EDGE_PADDING = 8
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

function getBoundedTrackManagementWindowPosition(left, top, trackManagementWindowSize, mapContainerRef) {
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

export function useTrackManagementWindowDrag({
    mapContainerRef,
    onMoveComplete,
    onActivate,
    onClaimKeyboardCustody,
    windowId,
    trackManagementWindowSize,
}) {
    const dragStateRef = useRef(null)
    const [dragPosition, setDragPosition] = useState(null)

    const handleHeaderPointerDown = useCallback((event) => {
        if (event.button !== 0) {
            return
        }

        event.stopPropagation()
        event.preventDefault()
        onActivate?.()
        onClaimKeyboardCustody?.(windowId)

        const trackManagementWindowElement = event.currentTarget.closest('[data-track-management-window]')
        const mapContainerElement = mapContainerRef.current

        if (!trackManagementWindowElement || !mapContainerElement) {
            return
        }

        const windowRect = trackManagementWindowElement.getBoundingClientRect()
        const containerRect = mapContainerElement.getBoundingClientRect()

        dragStateRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - windowRect.left,
            offsetY: event.clientY - windowRect.top,
            containerLeft: containerRect.left,
            containerTop: containerRect.top,
        }

        event.currentTarget.setPointerCapture?.(event.pointerId)
    }, [mapContainerRef, onActivate, onClaimKeyboardCustody, windowId])

    const handleHeaderPointerMove = useCallback((event) => {
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
            trackManagementWindowSize,
            mapContainerRef,
        )

        setDragPosition({
            x: boundedPosition.left,
            y: boundedPosition.top,
        })
    }, [mapContainerRef, trackManagementWindowSize])

    const handleHeaderPointerUp = useCallback((event) => {
        if (dragStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        dragStateRef.current = null

        setDragPosition((currentDragPosition) => {
            if (currentDragPosition) {
                const containerSize = getContainerSize(mapContainerRef)
                const windowSize = getWindowSize(trackManagementWindowSize)

                onMoveComplete?.(
                    windowId,
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
    }, [mapContainerRef, onMoveComplete, trackManagementWindowSize, windowId])

    return {
        dragPosition,
        handleHeaderPointerDown,
        handleHeaderPointerMove,
        handleHeaderPointerUp,
    }
}
