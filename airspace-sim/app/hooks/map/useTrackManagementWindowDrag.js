'use client'

import {useCallback, useRef} from 'react'

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

function getBoundedTrackManagementWindowPosition(left, top, trackManagementWindowSize, mapContainerRef) {
    const containerSize = getContainerSize(mapContainerRef)
    const windowSize = getWindowSize(trackManagementWindowSize)
    const maxLeft = Math.max(EDGE_PADDING, containerSize.width - windowSize.width - EDGE_PADDING)
    const maxTop = Math.max(EDGE_PADDING, containerSize.height - windowSize.height - EDGE_PADDING)

    return {
        x: Math.min(Math.max(EDGE_PADDING, left), maxLeft),
        y: Math.min(Math.max(EDGE_PADDING, top), maxTop),
    }
}

export function getTrackManagementWindowPosition(trackManagementWindow, trackManagementWindowSize, mapContainerRef) {
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

export function useTrackManagementWindowDrag({mapContainerRef, onMove, onActivate, onClaimKeyboardCustody, windowId, trackManagementWindowSize}) {
    const dragStateRef = useRef(null)

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

        onMove?.(
            windowId,
            getBoundedTrackManagementWindowPosition(
                left,
                top,
                trackManagementWindowSize,
                mapContainerRef,
            ),
        )
    }, [mapContainerRef, onMove, trackManagementWindowSize, windowId])

    const handleHeaderPointerUp = useCallback((event) => {
        if (dragStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        dragStateRef.current = null
    }, [])

    return {
        handleHeaderPointerDown,
        handleHeaderPointerMove,
        handleHeaderPointerUp,
    }
}
