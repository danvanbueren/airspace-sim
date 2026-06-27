'use client'

import {useCallback, useLayoutEffect, useRef, useState} from 'react'
import {useWorkspaceViewportContext} from '@/app/contexts/WorkspaceViewportContext'
import {
    MAP_FLOATING_INSET_PX,
    MAP_OVERLAY_DRAG_MIN_EDGE_PX,
    MAP_PERFORMANCE_OVERLAY_BOTTOM_PX,
} from '@/app/constants/mapUiLayout'
import {
    absoluteToEdgeAnchor,
    resolveEdgeAnchoredPosition,
} from '@/app/tools/map/edgeAnchoredPosition'
import {clampPositionClearOfSettingsFab} from '@/app/tools/map/settingsFabReserve'

function getOverlaySize(overlayRef) {
    return {
        width: overlayRef.current?.offsetWidth ?? 0,
        height: overlayRef.current?.offsetHeight ?? 0,
    }
}

function positionsEqual(leftPosition, rightPosition) {
    if (!leftPosition || !rightPosition) {
        return leftPosition === rightPosition
    }

    return leftPosition.left === rightPosition.left && leftPosition.top === rightPosition.top
}

function getDefaultOverlayPosition(overlayRef, containerSize) {
    const overlaySize = getOverlaySize(overlayRef)

    if (containerSize.width === 0 || overlaySize.width === 0 || overlaySize.height === 0) {
        return null
    }

    return {
        left: containerSize.width - overlaySize.width - MAP_FLOATING_INSET_PX,
        top: containerSize.height - overlaySize.height - MAP_PERFORMANCE_OVERLAY_BOTTOM_PX,
    }
}

function getPerformanceOverlayBounds(overlayRef, containerSize) {
    const overlaySize = getOverlaySize(overlayRef)

    return {
        minLeft: MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        minTop: MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        maxLeft: Math.max(
            MAP_OVERLAY_DRAG_MIN_EDGE_PX,
            containerSize.width - overlaySize.width - MAP_FLOATING_INSET_PX,
        ),
        maxTop: Math.max(
            MAP_OVERLAY_DRAG_MIN_EDGE_PX,
            containerSize.height - overlaySize.height - MAP_FLOATING_INSET_PX,
        ),
    }
}

export function getBoundedPerformanceOverlayPosition(left, top, overlayRef, containerSize) {
    const bounds = getPerformanceOverlayBounds(overlayRef, containerSize)
    const overlaySize = getOverlaySize(overlayRef)

    if (overlaySize.width === 0 || overlaySize.height === 0) {
        return {left, top}
    }

    return clampPositionClearOfSettingsFab(
        resolveEdgeAnchoredPosition(
            absoluteToEdgeAnchor(left, top, containerSize, overlaySize),
            containerSize,
            overlaySize,
            bounds,
        ),
        overlaySize,
        containerSize,
        bounds,
    )
}

function resolvePositionFromAnchor(anchorRef, overlayRef, containerSize) {
    const anchor = anchorRef.current

    if (!anchor) {
        return null
    }

    const overlaySize = getOverlaySize(overlayRef)

    if (containerSize.width === 0 || overlaySize.width === 0 || overlaySize.height === 0) {
        return null
    }

    const bounds = getPerformanceOverlayBounds(overlayRef, containerSize)

    return clampPositionClearOfSettingsFab(
        resolveEdgeAnchoredPosition(
            anchor,
            containerSize,
            overlaySize,
            bounds,
        ),
        overlaySize,
        containerSize,
        bounds,
    )
}

function applyResolvedPosition(setPosition, nextPosition) {
    setPosition((currentPosition) => {
        if (positionsEqual(currentPosition, nextPosition)) {
            return currentPosition
        }

        return nextPosition
    })
}

export function usePerformanceAnalyticsOverlayDrag({overlayRef, enabled}) {
    const {containerRef: mapContainerRef, size: containerSize, isResizing, resizeGeneration} = useWorkspaceViewportContext()
    const [position, setPosition] = useState(null)
    const dragStateRef = useRef(null)
    const positionAnchorRef = useRef(null)

    const syncPositionFromAnchor = useCallback(() => {
        if (isResizing) {
            return
        }

        const nextPosition = resolvePositionFromAnchor(
            positionAnchorRef,
            overlayRef,
            containerSize,
        )

        if (!nextPosition) {
            return
        }

        applyResolvedPosition(setPosition, nextPosition)
    }, [containerSize, isResizing, overlayRef])

    const commitPositionAnchor = useCallback((left, top) => {
        const overlaySize = getOverlaySize(overlayRef)

        if (containerSize.width === 0 || overlaySize.width === 0 || overlaySize.height === 0) {
            return
        }

        positionAnchorRef.current = absoluteToEdgeAnchor(left, top, containerSize, overlaySize)
    }, [containerSize, overlayRef])

    useLayoutEffect(() => {
        if (!enabled) {
            positionAnchorRef.current = null
            setPosition(null)
            return
        }

        if (positionAnchorRef.current) {
            syncPositionFromAnchor()
            return
        }

        const defaultPosition = getDefaultOverlayPosition(overlayRef, containerSize)

        if (!defaultPosition) {
            return
        }

        commitPositionAnchor(defaultPosition.left, defaultPosition.top)
        applyResolvedPosition(setPosition, defaultPosition)
    }, [commitPositionAnchor, containerSize, enabled, overlayRef, syncPositionFromAnchor])

    useLayoutEffect(() => {
        if (!enabled || isResizing) {
            return
        }

        syncPositionFromAnchor()
    }, [containerSize, enabled, isResizing, overlayRef, resizeGeneration, syncPositionFromAnchor])

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

        applyResolvedPosition(
            setPosition,
            getBoundedPerformanceOverlayPosition(left, top, overlayRef, containerSize),
        )
    }, [containerSize, overlayRef])

    const handleDragHandlePointerUp = useCallback((event) => {
        if (dragStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        dragStateRef.current = null

        setPosition((currentPosition) => {
            if (currentPosition) {
                commitPositionAnchor(currentPosition.left, currentPosition.top)
            }

            return currentPosition
        })
    }, [commitPositionAnchor])

    return {
        position,
        handlePanelPointerDown,
        handleDragHandlePointerDown,
        handleDragHandlePointerMove,
        handleDragHandlePointerUp,
    }
}
