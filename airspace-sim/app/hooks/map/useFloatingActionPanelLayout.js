'use client'

import {useCallback, useLayoutEffect, useRef, useState} from 'react'
import {
    MAP_GLASS_INSET_PX,
    MAP_OVERLAY_DRAG_MIN_EDGE_PX,
} from '@/app/constants/mapUiLayout'
import {
    ACTION_PANEL_MIN_HEIGHT_PX,
    ACTION_PANEL_MIN_WIDTH_PX,
    clampPanelWidth,
    normalizePanelHeight,
} from '@/app/actionPanels/normalizeActionPanels'
import {
    absoluteToEdgeAnchor,
    resolveEdgeAnchoredPosition,
} from '@/app/tools/map/edgeAnchoredPosition'

function getElementSize(elementRef) {
    const element = elementRef.current

    return {
        width: element?.offsetWidth ?? 0,
        height: element?.offsetHeight ?? 0,
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

function getMeasurementSize(panelRef, width, height) {
    const measured = getElementSize(panelRef)

    return {
        width: width ?? measured.width,
        height: height ?? measured.height,
    }
}

function getPanelBounds(panelRef, mapContainerRef, width, height) {
    const containerSize = getContainerSize(mapContainerRef)
    const panelSize = getMeasurementSize(panelRef, width, height)

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

function getBoundedPanelPosition(left, top, panelRef, mapContainerRef, width, height) {
    const bounds = getPanelBounds(panelRef, mapContainerRef, width, height)
    const panelSize = getMeasurementSize(panelRef, width, height)

    if (panelSize.width === 0) {
        return {left, top}
    }

    return resolveEdgeAnchoredPosition(
        absoluteToEdgeAnchor(left, top, getContainerSize(mapContainerRef), panelSize),
        getContainerSize(mapContainerRef),
        panelSize,
        bounds,
    )
}

function resolvePositionFromAnchor(anchor, panelRef, mapContainerRef, width, height) {
    if (!anchor) {
        return null
    }

    const containerSize = getContainerSize(mapContainerRef)
    const panelSize = getMeasurementSize(panelRef, width, height)

    if (containerSize.width === 0 || panelSize.width === 0) {
        return null
    }

    return resolveEdgeAnchoredPosition(
        anchor,
        containerSize,
        panelSize,
        getPanelBounds(panelRef, mapContainerRef, width, height),
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

function getViewportMaxDimensions(position, mapContainerRef) {
    const containerSize = getContainerSize(mapContainerRef)

    if (!position) {
        return {
            maxWidth: containerSize.width - MAP_GLASS_INSET_PX * 2,
            maxHeight: containerSize.height - MAP_GLASS_INSET_PX * 2,
        }
    }

    return {
        maxWidth: Math.max(
            ACTION_PANEL_MIN_WIDTH_PX,
            containerSize.width - position.left - MAP_GLASS_INSET_PX,
        ),
        maxHeight: Math.max(
            ACTION_PANEL_MIN_HEIGHT_PX,
            containerSize.height - position.top - MAP_GLASS_INSET_PX,
        ),
    }
}

function clampPanelHeight(height, maxHeight) {
    if (height === null || height === undefined) {
        return null
    }

    return Math.min(
        maxHeight,
        Math.max(ACTION_PANEL_MIN_HEIGHT_PX, Math.round(height)),
    )
}

export function useFloatingActionPanelLayout({
    mapContainerRef,
    panelRef,
    interactionsEnabled,
    storedAnchor,
    storedWidth,
    storedHeight,
    onLayoutCommit,
}) {
    const [position, setPosition] = useState(null)
    const [width, setWidth] = useState(() => clampPanelWidth(storedWidth))
    const [height, setHeight] = useState(() => normalizePanelHeight(storedHeight))
    const [isPositionResolved, setIsPositionResolved] = useState(false)
    const dragStateRef = useRef(null)
    const resizeStateRef = useRef(null)
    const positionAnchorRef = useRef(storedAnchor ?? null)
    const widthRef = useRef(width)
    const heightRef = useRef(height)
    const positionRef = useRef(position)

    widthRef.current = width
    heightRef.current = height
    positionRef.current = position

    const syncPositionFromAnchor = useCallback(() => {
        const nextPosition = resolvePositionFromAnchor(
            positionAnchorRef.current,
            panelRef,
            mapContainerRef,
            widthRef.current,
            heightRef.current,
        )

        if (!nextPosition) {
            setIsPositionResolved(false)
            return false
        }

        setIsPositionResolved(true)
        applyResolvedPosition(setPosition, nextPosition)
        return true
    }, [mapContainerRef, panelRef])

    const commitPositionAnchor = useCallback((left, top) => {
        const containerSize = getContainerSize(mapContainerRef)
        const panelSize = getMeasurementSize(
            panelRef,
            widthRef.current,
            heightRef.current,
        )

        if (containerSize.width === 0 || panelSize.width === 0) {
            return
        }

        positionAnchorRef.current = absoluteToEdgeAnchor(left, top, containerSize, panelSize)
    }, [mapContainerRef, panelRef])

    useLayoutEffect(() => {
        setWidth(clampPanelWidth(storedWidth))
    }, [storedWidth])

    useLayoutEffect(() => {
        setHeight(normalizePanelHeight(storedHeight))
    }, [storedHeight])

    useLayoutEffect(() => {
        positionAnchorRef.current = storedAnchor ?? positionAnchorRef.current
        syncPositionFromAnchor()
    }, [storedAnchor, syncPositionFromAnchor])

    useLayoutEffect(() => {
        if (!mapContainerRef.current || !panelRef.current) {
            return undefined
        }

        let frameRef = null
        let cancelled = false

        const scheduleSync = () => {
            if (frameRef) {
                return
            }

            frameRef = requestAnimationFrame(() => {
                frameRef = null

                if (cancelled) {
                    return
                }

                const resolved = syncPositionFromAnchor()

                if (!resolved) {
                    scheduleSync()
                }
            })
        }

        scheduleSync()

        const observedElements = [mapContainerRef.current, panelRef.current]
        const resizeObserver = new ResizeObserver(() => {
            scheduleSync()
        })

        observedElements.forEach((element) => {
            resizeObserver.observe(element)
        })

        return () => {
            cancelled = true
            resizeObserver.disconnect()

            if (frameRef) {
                cancelAnimationFrame(frameRef)
            }
        }
    }, [mapContainerRef, panelRef, syncPositionFromAnchor])

    const handlePanelPointerDown = useCallback((event) => {
        event.stopPropagation()
    }, [])

    const handleDragHandlePointerDown = useCallback((event) => {
        if (!interactionsEnabled || event.button !== 0) {
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
    }, [interactionsEnabled, mapContainerRef, panelRef])

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
            getBoundedPanelPosition(
                left,
                top,
                panelRef,
                mapContainerRef,
                widthRef.current,
                heightRef.current,
            ),
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
                    width: widthRef.current,
                    height: heightRef.current,
                })
            }

            return currentPosition
        })
    }, [commitPositionAnchor, onLayoutCommit])

    const handleResizeHandlePointerDown = useCallback((event) => {
        if (!interactionsEnabled || event.button !== 0) {
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
            startY: event.clientY,
            startWidth: panelElement.offsetWidth,
            startHeight: panelElement.offsetHeight,
        }

        event.currentTarget.setPointerCapture?.(event.pointerId)
    }, [interactionsEnabled, panelRef])

    const handleResizeHandlePointerMove = useCallback((event) => {
        const resizeState = resizeStateRef.current

        if (!resizeState || resizeState.pointerId !== event.pointerId) {
            return
        }

        event.preventDefault()
        event.stopPropagation()

        const {maxWidth, maxHeight} = getViewportMaxDimensions(positionRef.current, mapContainerRef)
        const deltaX = event.clientX - resizeState.startX
        const deltaY = event.clientY - resizeState.startY
        const nextWidth = clampPanelWidth(resizeState.startWidth + deltaX, maxWidth)
        const nextHeight = clampPanelHeight(resizeState.startHeight + deltaY, maxHeight)

        setWidth(nextWidth)
        setHeight(nextHeight)
    }, [mapContainerRef])

    const handleResizeHandlePointerUp = useCallback((event) => {
        if (resizeStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        resizeStateRef.current = null

        const {maxWidth, maxHeight} = getViewportMaxDimensions(positionRef.current, mapContainerRef)
        const committedWidth = clampPanelWidth(widthRef.current, maxWidth)
        const committedHeight = clampPanelHeight(heightRef.current, maxHeight)

        setWidth(committedWidth)
        setHeight(committedHeight)

        onLayoutCommit?.({
            anchor: positionAnchorRef.current,
            width: committedWidth,
            height: committedHeight,
        })

        syncPositionFromAnchor()
    }, [mapContainerRef, onLayoutCommit, syncPositionFromAnchor])

    return {
        position,
        width,
        height,
        isPositionResolved,
        handlePanelPointerDown,
        handleDragHandlePointerDown,
        handleDragHandlePointerMove,
        handleDragHandlePointerUp,
        handleResizeHandlePointerDown,
        handleResizeHandlePointerMove,
        handleResizeHandlePointerUp,
    }
}
