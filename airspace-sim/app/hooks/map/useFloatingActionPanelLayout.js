'use client'

import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
import {createInitialActionPanelPosition} from '@/app/actionPanels/actionPanelViewportLayout'
import {resolveActionPanelLayoutSize} from '@/app/actionPanels/actionPanelSizeEstimate'
import {
    buildStoredLayoutSnapshot,
    getPanelBoundsForViewport,
    getViewportMaxPanelDimensions,
    normalizeLayoutForViewport,
    viewportLayoutDiffersFromStored,
} from '@/app/actionPanels/actionPanelViewportLayout'
import {
    ACTION_PANEL_MIN_HEIGHT_PX,
    clampPanelWidth,
    getActionPanelMinResizedHeight,
    normalizePanelHeight,
} from '@/app/actionPanels/normalizeActionPanels'
import {
    absoluteToEdgeAnchor,
    resolveEdgeAnchoredPosition,
} from '@/app/tools/map/edgeAnchoredPosition'
import {clampPositionClearOfSettingsFab} from '@/app/tools/map/settingsFabReserve'
import {getWorkspaceContainerSize} from '@/app/tools/map/workspaceContainerSize'

function positionsEqual(leftPosition, rightPosition) {
    if (!leftPosition || !rightPosition) {
        return leftPosition === rightPosition
    }

    return leftPosition.left === rightPosition.left && leftPosition.top === rightPosition.top
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
    itemIds,
    storedAnchor,
    storedWidth,
    storedHeight,
    onLayoutCommit,
}) {
    const minResizedHeight = getActionPanelMinResizedHeight(displayStyle)
    const contentMinHeight = ACTION_PANEL_MIN_HEIGHT_PX

    const [width, setWidth] = useState(() => clampPanelWidth(storedWidth))
    const [height, setHeight] = useState(() => normalizePanelHeight(storedHeight, displayStyle))
    const [position, setPosition] = useState(() => createInitialActionPanelPosition({
        storedAnchor,
        storedWidth,
        itemIds,
        displayStyle,
        containerSize: getWorkspaceContainerSize(mapContainerRef),
    }))
    const dragStateRef = useRef(null)
    const resizeStateRef = useRef(null)
    const positionAnchorRef = useRef(storedAnchor ?? null)
    const widthRef = useRef(width)
    const heightRef = useRef(height)
    const positionRef = useRef(position)
    const pendingViewportCommitRef = useRef(null)

    widthRef.current = width
    heightRef.current = height
    positionRef.current = position

    const getLayoutPanelSize = useCallback(() => {
        const resolvedSize = resolveActionPanelLayoutSize({
            panelRef,
            width: widthRef.current,
            height: heightRef.current,
            itemIds,
            displayStyle,
            contentMinHeight,
        })

        return {
            width: resolvedSize.width,
            height: resolvedSize.height,
        }
    }, [contentMinHeight, displayStyle, itemIds, panelRef])

    const applyViewportNormalizedLayout = useCallback((normalizedLayout) => {
        positionAnchorRef.current = normalizedLayout.anchor
        widthRef.current = normalizedLayout.width
        heightRef.current = normalizedLayout.height
        setWidth(normalizedLayout.width)
        setHeight(normalizedLayout.height)
        applyResolvedPosition(setPosition, normalizedLayout.position)
    }, [])

    const runPositionSync = useCallback((shouldCommitCorrections = false) => {
        if (resizeStateRef.current || dragStateRef.current) {
            return true
        }

        const containerSize = getWorkspaceContainerSize(mapContainerRef)

        if (containerSize.width <= 0 || containerSize.height <= 0 || !positionAnchorRef.current) {
            return false
        }

        const panelSize = getLayoutPanelSize()
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
            resolvedPanelSize: panelSize,
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
                resolvedPanelSize: panelSize,
            },
        )

        if (
            normalizedStoredLayout
            && viewportLayoutDiffersFromStored(storedLayoutFromProps, normalizedStoredLayout)
        ) {
            applyViewportNormalizedLayout(normalizedStoredLayout)
            pendingViewportCommitRef.current = {
                anchor: normalizedStoredLayout.anchor,
                width: normalizedStoredLayout.width,
                height: normalizedStoredLayout.height,
            }
        }

        return true
    }, [
        applyViewportNormalizedLayout,
        contentMinHeight,
        getLayoutPanelSize,
        mapContainerRef,
        minResizedHeight,
        storedAnchor,
        storedHeight,
        storedWidth,
    ])

    useEffect(() => {
        const pendingCommit = pendingViewportCommitRef.current

        if (!pendingCommit || !onLayoutCommit) {
            return
        }

        pendingViewportCommitRef.current = null
        onLayoutCommit(pendingCommit)
    })

    const commitPositionAnchor = useCallback((left, top) => {
        const containerSize = getWorkspaceContainerSize(mapContainerRef)
        const panelSize = getLayoutPanelSize()

        if (containerSize.width === 0) {
            return
        }

        positionAnchorRef.current = absoluteToEdgeAnchor(left, top, containerSize, panelSize)
    }, [getLayoutPanelSize, mapContainerRef])

    const getBoundedPanelPosition = useCallback((left, top) => {
        const containerSize = getWorkspaceContainerSize(mapContainerRef)
        const panelSize = getLayoutPanelSize()
        const bounds = getPanelBoundsForViewport(containerSize, panelSize)

        return clampPositionClearOfSettingsFab(
            resolveEdgeAnchoredPosition(
                absoluteToEdgeAnchor(left, top, containerSize, panelSize),
                containerSize,
                panelSize,
                bounds,
            ),
            panelSize,
            containerSize,
            bounds,
        )
    }, [getLayoutPanelSize, mapContainerRef])

    useLayoutEffect(() => {
        setWidth(clampPanelWidth(storedWidth))
    }, [storedWidth])

    useLayoutEffect(() => {
        setHeight(normalizePanelHeight(storedHeight, displayStyle))
    }, [displayStyle, storedHeight])

    useLayoutEffect(() => {
        positionAnchorRef.current = storedAnchor ?? positionAnchorRef.current
        runPositionSync(true)
    }, [displayStyle, itemIds, runPositionSync, storedAnchor, storedHeight, storedWidth])

    useLayoutEffect(() => {
        let cancelled = false
        let frameRef = null
        let resizeObserver = null

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

        const attachObserver = () => {
            if (cancelled) {
                return
            }

            if (!mapContainerRef.current) {
                frameRef = requestAnimationFrame(attachObserver)
                return
            }

            runPositionSync(true)
            scheduleSync(true)

            resizeObserver = new ResizeObserver(() => {
                scheduleSync(true)
            })

            resizeObserver.observe(mapContainerRef.current)
        }

        attachObserver()

        return () => {
            cancelled = true
            resizeObserver?.disconnect()

            if (frameRef) {
                cancelAnimationFrame(frameRef)
            }
        }
    }, [mapContainerRef, runPositionSync])

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
            getBoundedPanelPosition(left, top),
        )
    }, [getBoundedPanelPosition])

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

        const containerSize = getWorkspaceContainerSize(mapContainerRef)
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

        const containerSize = getWorkspaceContainerSize(mapContainerRef)
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
        handlePanelPointerDown,
        handleDragHandlePointerDown,
        handleDragHandlePointerMove,
        handleDragHandlePointerUp,
        handleResizeHandlePointerDown,
        handleResizeHandlePointerMove,
        handleResizeHandlePointerUp,
    }
}
