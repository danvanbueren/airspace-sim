'use client'

import {useCallback, useLayoutEffect, useRef, useState} from 'react'
import {
    MAP_GLASS_INSET_PX,
    MAP_OVERLAY_DRAG_MIN_EDGE_PX,
} from '@/app/constants/mapUiLayout'
import {
    ACTION_PANEL_MAX_WIDTH_PX,
    ACTION_PANEL_MIN_WIDTH_PX,
} from '@/app/actionPanels/normalizeActionPanels'
import {
    absoluteToEdgeAnchor,
    resolveEdgeAnchoredPosition,
} from '@/app/tools/map/edgeAnchoredPosition'

function getElementSize(elementRef) {
    return {
        width: elementRef.current?.offsetWidth ?? 0,
        height: elementRef.current?.offsetHeight ?? 0,
    }
}

function getContainerSize(mapContainerRef) {
    const container = mapContainerRef.current

    return {
        width: container?.clientWidth ?? 0,
        height: container?.clientHeight ?? 0,
    }
}

function positionsEqual(leftPosition, rightPosition) {
    if (!leftPosition || !rightPosition) {
        return leftPosition === rightPosition
    }

    return leftPosition.left === rightPosition.left && leftPosition.top === rightPosition.top
}

function getPanelBounds(panelRef, mapContainerRef) {
    const containerSize = getContainerSize(mapContainerRef)
    const panelSize = getElementSize(panelRef)

    return {
        minLeft: MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        minTop: MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        maxLeft: Math.max(
            MAP_OVERLAY_DRAG_MIN_EDGE_PX,
            containerSize.width - panelSize.width - MAP_GLASS_INSET_PX,
        ),
        maxTop: Math.max(
            MAP_OVERLAY_DRAG_MIN_EDGE_PX,
            containerSize.height - panelSize.height - MAP_GLASS_INSET_PX,
        ),
    }
}

function getBoundedPanelPosition(left, top, panelRef, mapContainerRef) {
    const bounds = getPanelBounds(panelRef, mapContainerRef)
    const panelSize = getElementSize(panelRef)

    if (panelSize.width === 0 || panelSize.height === 0) {
        return {left, top}
    }

    return resolveEdgeAnchoredPosition(
        absoluteToEdgeAnchor(left, top, getContainerSize(mapContainerRef), panelSize),
        getContainerSize(mapContainerRef),
        panelSize,
        bounds,
    )
}

function resolvePositionFromAnchor(anchor, panelRef, mapContainerRef) {
    if (!anchor) {
        return null
    }

    const containerSize = getContainerSize(mapContainerRef)
    const panelSize = getElementSize(panelRef)

    if (containerSize.width === 0 || panelSize.width === 0 || panelSize.height === 0) {
        return null
    }

    return resolveEdgeAnchoredPosition(
        anchor,
        containerSize,
        panelSize,
        getPanelBounds(panelRef, mapContainerRef),
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

function clampPanelWidth(width) {
    return Math.min(
        ACTION_PANEL_MAX_WIDTH_PX,
        Math.max(ACTION_PANEL_MIN_WIDTH_PX, Math.round(width)),
    )
}

export function useFloatingActionPanelLayout({
    mapContainerRef,
    panelRef,
    enabled,
    storedAnchor,
    storedWidth,
    onLayoutCommit,
}) {
    const [position, setPosition] = useState(null)
    const [width, setWidth] = useState(() => clampPanelWidth(storedWidth))
    const dragStateRef = useRef(null)
    const resizeStateRef = useRef(null)
    const positionAnchorRef = useRef(storedAnchor ?? null)

    const syncPositionFromAnchor = useCallback(() => {
        const nextPosition = resolvePositionFromAnchor(
            positionAnchorRef.current,
            panelRef,
            mapContainerRef,
        )

        if (!nextPosition) {
            return
        }

        applyResolvedPosition(setPosition, nextPosition)
    }, [mapContainerRef, panelRef])

    const commitPositionAnchor = useCallback((left, top) => {
        const containerSize = getContainerSize(mapContainerRef)
        const panelSize = getElementSize(panelRef)

        if (containerSize.width === 0 || panelSize.width === 0 || panelSize.height === 0) {
            return
        }

        positionAnchorRef.current = absoluteToEdgeAnchor(left, top, containerSize, panelSize)
    }, [mapContainerRef, panelRef])

    useLayoutEffect(() => {
        setWidth(clampPanelWidth(storedWidth))
    }, [storedWidth])

    useLayoutEffect(() => {
        if (!enabled) {
            return
        }

        positionAnchorRef.current = storedAnchor ?? positionAnchorRef.current
        syncPositionFromAnchor()
    }, [enabled, storedAnchor, syncPositionFromAnchor])

    useLayoutEffect(() => {
        if (!enabled || !mapContainerRef.current) {
            return undefined
        }

        const container = mapContainerRef.current
        let frameRef = null

        const resizeObserver = new ResizeObserver(() => {
            if (frameRef) {
                return
            }

            frameRef = requestAnimationFrame(() => {
                frameRef = null
                syncPositionFromAnchor()
            })
        })

        resizeObserver.observe(container)

        return () => {
            resizeObserver.disconnect()

            if (frameRef) {
                cancelAnimationFrame(frameRef)
            }
        }
    }, [enabled, mapContainerRef, syncPositionFromAnchor])

    const handlePanelPointerDown = useCallback((event) => {
        event.stopPropagation()
    }, [])

    const handleDragHandlePointerDown = useCallback((event) => {
        if (!enabled || event.button !== 0) {
            return
        }

        event.stopPropagation()
        event.preventDefault()

        const panelElement = panelRef.current
        const mapContainerElement = mapContainerRef.current

        if (!panelElement || !mapContainerElement) {
            return
        }

        const panelRect = panelElement.getBoundingClientRect()
        const containerRect = mapContainerElement.getBoundingClientRect()

        dragStateRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - panelRect.left,
            offsetY: event.clientY - panelRect.top,
            containerLeft: containerRect.left,
            containerTop: containerRect.top,
        }

        event.currentTarget.setPointerCapture?.(event.pointerId)
    }, [enabled, mapContainerRef, panelRef])

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
            getBoundedPanelPosition(left, top, panelRef, mapContainerRef),
        )
    }, [mapContainerRef, panelRef])

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

                onLayoutCommit?.({
                    anchor: positionAnchorRef.current,
                    width,
                })
            }

            return currentPosition
        })
    }, [commitPositionAnchor, onLayoutCommit, width])

    const handleResizeHandlePointerDown = useCallback((event) => {
        if (!enabled || event.button !== 0) {
            return
        }

        event.stopPropagation()
        event.preventDefault()

        const panelElement = panelRef.current

        if (!panelElement) {
            return
        }

        resizeStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startWidth: panelElement.offsetWidth,
        }

        event.currentTarget.setPointerCapture?.(event.pointerId)
    }, [enabled, panelRef])

    const handleResizeHandlePointerMove = useCallback((event) => {
        const resizeState = resizeStateRef.current

        if (!resizeState || resizeState.pointerId !== event.pointerId) {
            return
        }

        event.preventDefault()
        event.stopPropagation()

        const deltaX = event.clientX - resizeState.startX
        const nextWidth = clampPanelWidth(resizeState.startWidth + deltaX)

        setWidth(nextWidth)
    }, [])

    const handleResizeHandlePointerUp = useCallback((event) => {
        if (resizeStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        resizeStateRef.current = null

        setWidth((currentWidth) => {
            const clampedWidth = clampPanelWidth(currentWidth)

            onLayoutCommit?.({
                anchor: positionAnchorRef.current,
                width: clampedWidth,
            })

            return clampedWidth
        })

        syncPositionFromAnchor()
    }, [onLayoutCommit, syncPositionFromAnchor])

    return {
        position,
        width,
        handlePanelPointerDown,
        handleDragHandlePointerDown,
        handleDragHandlePointerMove,
        handleDragHandlePointerUp,
        handleResizeHandlePointerDown,
        handleResizeHandlePointerMove,
        handleResizeHandlePointerUp,
    }
}
