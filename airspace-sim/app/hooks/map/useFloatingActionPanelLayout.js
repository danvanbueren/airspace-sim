'use client'

import {useCallback, useLayoutEffect, useRef, useState} from 'react'
import {
    buildStoredLayoutSnapshot,
    getPanelBoundsForViewport,
    getViewportMaxPanelDimensions,
    normalizeLayoutForViewport,
    viewportLayoutDiffersFromStored,
} from '@/app/actionPanels/actionPanelViewportLayout'
import {
    ACTION_PANEL_MIN_HEIGHT_PX,
    ACTION_PANEL_MIN_WIDTH_PX,
    clampPanelWidth,
    getActionPanelMinResizedHeight,
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

function getResolvedPanelSize(panelRef, width, height, contentMinHeight) {
    const measured = getElementSize(panelRef)

    return {
        width: Math.max(width || measured.width || ACTION_PANEL_MIN_WIDTH_PX, ACTION_PANEL_MIN_WIDTH_PX),
        height: Math.max(
            height || measured.height || contentMinHeight,
            contentMinHeight,
        ),
    }
}

function getPanelBounds(panelRef, mapContainerRef, width, height, contentMinHeight) {
    const containerSize = getContainerSize(mapContainerRef)
    const panelSize = getResolvedPanelSize(panelRef, width, height, contentMinHeight)

    return getPanelBoundsForViewport(containerSize, panelSize)
}

function getBoundedPanelPosition(left, top, panelRef, mapContainerRef, width, height, contentMinHeight) {
    const containerSize = getContainerSize(mapContainerRef)
    const panelSize = getResolvedPanelSize(panelRef, width, height, contentMinHeight)

    return resolveEdgeAnchoredPosition(
        absoluteToEdgeAnchor(left, top, containerSize, panelSize),
        containerSize,
        panelSize,
        getPanelBounds(panelRef, mapContainerRef, width, height, contentMinHeight),
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

function clampPanelHeight(height, maxHeight, minHeight) {
    if (height === null || height === undefined) {
        return null
    }

    return Math.min(
        maxHeight,
        Math.max(minHeight, Math.round(height)),
    )
}

export function useFloatingActionPanelLayout({
    mapContainerRef,
    panelRef,
    interactionsEnabled,
    displayStyle,
    storedAnchor,
    storedWidth,
    storedHeight,
    onLayoutCommit,
}) {
    const minResizedHeight = getActionPanelMinResizedHeight(displayStyle)
    const contentMinHeight = ACTION_PANEL_MIN_HEIGHT_PX

    const [width, setWidth] = useState(() => clampPanelWidth(storedWidth))
    const [height, setHeight] = useState(() => normalizePanelHeight(storedHeight, displayStyle))
    const [position, setPosition] = useState(null)
    const [isPositionReady, setIsPositionReady] = useState(false)
    const dragStateRef = useRef(null)
    const resizeStateRef = useRef(null)
    const positionAnchorRef = useRef(storedAnchor ?? null)
    const widthRef = useRef(width)
    const heightRef = useRef(height)
    const positionRef = useRef(position)

    widthRef.current = width
    heightRef.current = height
    positionRef.current = position

    const applyViewportNormalizedLayout = useCallback((normalizedLayout) => {
        positionAnchorRef.current = normalizedLayout.anchor
        widthRef.current = normalizedLayout.width
        heightRef.current = normalizedLayout.height
        setWidth(normalizedLayout.width)
        setHeight(normalizedLayout.height)
        applyResolvedPosition(setPosition, normalizedLayout.position)
        setIsPositionReady(true)
    }, [])

    const runPositionSync = useCallback((shouldCommitCorrections = false) => {
        if (resizeStateRef.current) {
            return true
        }

        const containerSize = getContainerSize(mapContainerRef)

        if (containerSize.width <= 0 || containerSize.height <= 0 || !positionAnchorRef.current) {
            return false
        }

        const storedLayoutFromProps = buildStoredLayoutSnapshot(
            storedAnchor,
            storedWidth,
            storedHeight,
        )
        const currentLayout = buildStoredLayoutSnapshot(
            positionAnchorRef.current,
            widthRef.current,
            heightRef.current,
        )
        const normalizedCurrentLayout = normalizeLayoutForViewport(currentLayout, containerSize, {
            contentMinHeight,
            minResizedHeight,
        })

        if (!normalizedCurrentLayout) {
            return false
        }

        applyViewportNormalizedLayout(normalizedCurrentLayout)

        if (!shouldCommitCorrections || !onLayoutCommit) {
            return true
        }

        const normalizedStoredLayout = normalizeLayoutForViewport(
            storedLayoutFromProps,
            containerSize,
            {
                contentMinHeight,
                minResizedHeight,
            },
        )

        if (
            normalizedStoredLayout
            && viewportLayoutDiffersFromStored(storedLayoutFromProps, normalizedStoredLayout)
        ) {
            applyViewportNormalizedLayout(normalizedStoredLayout)
            onLayoutCommit({
                anchor: normalizedStoredLayout.anchor,
                width: normalizedStoredLayout.width,
                height: normalizedStoredLayout.height,
            })
        }

        return true
    }, [
        applyViewportNormalizedLayout,
        contentMinHeight,
        mapContainerRef,
        minResizedHeight,
        onLayoutCommit,
        storedAnchor,
        storedHeight,
        storedWidth,
    ])

    const commitPositionAnchor = useCallback((left, top) => {
        const containerSize = getContainerSize(mapContainerRef)
        const panelSize = getResolvedPanelSize(
            panelRef,
            widthRef.current,
            heightRef.current,
            contentMinHeight,
        )

        if (containerSize.width === 0) {
            return
        }

        positionAnchorRef.current = absoluteToEdgeAnchor(left, top, containerSize, panelSize)
    }, [contentMinHeight, mapContainerRef, panelRef])

    useLayoutEffect(() => {
        setWidth(clampPanelWidth(storedWidth))
    }, [storedWidth])

    useLayoutEffect(() => {
        setHeight(normalizePanelHeight(storedHeight, displayStyle))
    }, [displayStyle, storedHeight])

    useLayoutEffect(() => {
        positionAnchorRef.current = storedAnchor ?? positionAnchorRef.current
        runPositionSync(true)
    }, [displayStyle, runPositionSync, storedAnchor, storedHeight, storedWidth])

    useLayoutEffect(() => {
        if (!mapContainerRef.current) {
            return undefined
        }

        let frameRef = null
        let cancelled = false

        const scheduleSync = (shouldCommitCorrections = false) => {
            if (frameRef) {
                return
            }

            frameRef = requestAnimationFrame(() => {
                frameRef = null

                if (cancelled) {
                    return
                }

                if (!runPositionSync(shouldCommitCorrections)) {
                    scheduleSync(shouldCommitCorrections)
                }
            })
        }

        scheduleSync(true)

        const resizeObserver = new ResizeObserver(() => {
            scheduleSync(true)
        })

        resizeObserver.observe(mapContainerRef.current)

        if (panelRef.current) {
            resizeObserver.observe(panelRef.current)
        }

        return () => {
            cancelled = true
            resizeObserver.disconnect()

            if (frameRef) {
                cancelAnimationFrame(frameRef)
            }
        }
    }, [mapContainerRef, panelRef, runPositionSync])

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
                contentMinHeight,
            ),
        )
    }, [contentMinHeight, mapContainerRef, panelRef])

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

        const containerSize = getContainerSize(mapContainerRef)
        const {maxWidth, maxHeight} = getViewportMaxPanelDimensions(
            positionRef.current,
            containerSize,
            minResizedHeight,
        )
        const deltaX = event.clientX - resizeState.startX
        const deltaY = event.clientY - resizeState.startY
        const nextWidth = clampPanelWidth(resizeState.startWidth + deltaX, maxWidth)
        const nextHeight = clampPanelHeight(
            resizeState.startHeight + deltaY,
            maxHeight,
            minResizedHeight,
        )

        widthRef.current = nextWidth
        heightRef.current = nextHeight
        setWidth(nextWidth)
        setHeight(nextHeight)
    }, [mapContainerRef, minResizedHeight])

    const handleResizeHandlePointerUp = useCallback((event) => {
        if (resizeStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        resizeStateRef.current = null

        const containerSize = getContainerSize(mapContainerRef)
        const {maxWidth, maxHeight} = getViewportMaxPanelDimensions(
            positionRef.current,
            containerSize,
            minResizedHeight,
        )
        const committedWidth = clampPanelWidth(widthRef.current, maxWidth)
        const committedHeight = clampPanelHeight(heightRef.current, maxHeight, minResizedHeight)

        widthRef.current = committedWidth
        heightRef.current = committedHeight
        setWidth(committedWidth)
        setHeight(committedHeight)

        setPosition((currentPosition) => {
            if (currentPosition) {
                commitPositionAnchor(currentPosition.left, currentPosition.top)

                onLayoutCommit?.({
                    anchor: positionAnchorRef.current,
                    width: committedWidth,
                    height: committedHeight,
                })
            }

            return currentPosition
        })
    }, [commitPositionAnchor, mapContainerRef, minResizedHeight, onLayoutCommit])

    return {
        position,
        width,
        height,
        isPositionReady,
        handlePanelPointerDown,
        handleDragHandlePointerDown,
        handleDragHandlePointerMove,
        handleDragHandlePointerUp,
        handleResizeHandlePointerDown,
        handleResizeHandlePointerMove,
        handleResizeHandlePointerUp,
    }
}
