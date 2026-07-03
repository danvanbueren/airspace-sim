'use client'

import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
import {useWorkspaceViewportContext} from '@/app/contexts/WorkspaceViewportContext'
import {createInitialActionPanelPosition} from '@/app/tools/actionPanels/actionPanelViewportLayout'
import {resolveActionPanelLayoutSize} from '@/app/tools/actionPanels/actionPanelSizeEstimate'
import {
    buildStoredLayoutSnapshot,
    getPanelBoundsForViewport,
    getViewportMaxPanelDimensions,
    resolveViewportLayoutFromAnchor,
    runtimeLayoutDiffersFromStored,
    viewportDimensionsDifferFromStored,
} from '@/app/tools/actionPanels/actionPanelViewportLayout'
import {
    ACTION_PANEL_MIN_HEIGHT_PX,
    clampPanelWidth,
    getActionPanelMinResizedHeight,
    normalizePanelHeight,
} from '@/app/tools/actionPanels/normalizeActionPanels'
import {
    absoluteToEdgeAnchor,
    resolveEdgeAnchoredPosition,
} from '@/app/tools/map/edgeAnchoredPosition'
import {clampPositionClearOfSettingsFab, getFabAwareMaxLeftForPanelTop} from '@/app/tools/map/settingsFabReserve'

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
    panelRef,
    interactionsEnabled,
    displayStyle,
    itemIds,
    storedAnchor,
    storedWidth,
    storedHeight,
    onLayoutCommit,
}) {
    const {containerRef: mapContainerRef, size: containerSize, isResizing, resizeGeneration, resizeLayoutTick} = useWorkspaceViewportContext()
    const minResizedHeight = getActionPanelMinResizedHeight(displayStyle)
    const contentMinHeight = ACTION_PANEL_MIN_HEIGHT_PX

    const [width, setWidth] = useState(() => clampPanelWidth(storedWidth))
    const [height, setHeight] = useState(() => normalizePanelHeight(storedHeight, displayStyle))
    const [position, setPosition] = useState(() => createInitialActionPanelPosition({
        storedAnchor,
        storedWidth,
        itemIds,
        displayStyle,
        containerSize,
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

    const displayPosition = position ?? createInitialActionPanelPosition({
        storedAnchor,
        storedWidth,
        itemIds,
        displayStyle,
        containerSize,
    })

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

    const applyViewportResolvedLayout = useCallback((resolvedLayout) => {
        widthRef.current = resolvedLayout.width
        heightRef.current = resolvedLayout.height
        setWidth(resolvedLayout.width)
        setHeight(resolvedLayout.height)
        applyResolvedPosition(setPosition, resolvedLayout.position)
    }, [])

    const runPositionSync = useCallback((shouldCommitCorrections = false) => {
        if (resizeStateRef.current || dragStateRef.current) {
            return true
        }

        if (containerSize.width <= 0 || containerSize.height <= 0) {
            return false
        }

        if (!positionAnchorRef.current && storedAnchor) {
            positionAnchorRef.current = storedAnchor
        }

        if (!positionAnchorRef.current) {
            return false
        }

        const storedLayoutFromProps = buildStoredLayoutSnapshot(
            storedAnchor,
            clampPanelWidth(storedWidth),
            normalizePanelHeight(storedHeight, displayStyle),
        )
        const currentLayout = buildStoredLayoutSnapshot(
            positionAnchorRef.current,
            widthRef.current,
            heightRef.current,
        )
        const shouldFollowStoredLayout = runtimeLayoutDiffersFromStored(
            currentLayout,
            storedLayoutFromProps,
        )

        if (shouldFollowStoredLayout) {
            positionAnchorRef.current = storedAnchor
            widthRef.current = storedLayoutFromProps.width
            heightRef.current = storedLayoutFromProps.height
        }

        const sourceLayout = shouldFollowStoredLayout ? storedLayoutFromProps : currentLayout
        const panelSize = resolveActionPanelLayoutSize({
            panelRef,
            width: sourceLayout.width,
            height: sourceLayout.height,
            itemIds,
            displayStyle,
            contentMinHeight,
        })
        const resolvedLayout = resolveViewportLayoutFromAnchor(
            sourceLayout.anchor,
            sourceLayout.width,
            sourceLayout.height,
            containerSize,
            {
                contentMinHeight,
                minResizedHeight,
                resolvedPanelSize: panelSize,
                preserveDimensions: isResizing,
            },
        )

        if (!resolvedLayout) {
            return false
        }

        applyViewportResolvedLayout(resolvedLayout)

        if (!shouldCommitCorrections || !onLayoutCommit) {
            return true
        }

        const normalizedStoredLayout = resolveViewportLayoutFromAnchor(
            storedLayoutFromProps.anchor,
            storedLayoutFromProps.width,
            storedLayoutFromProps.height,
            containerSize,
            {
                contentMinHeight,
                minResizedHeight,
                resolvedPanelSize: panelSize,
            },
        )

        if (
            normalizedStoredLayout
            && viewportDimensionsDifferFromStored(storedLayoutFromProps, normalizedStoredLayout)
        ) {
            pendingViewportCommitRef.current = {
                anchor: storedLayoutFromProps.anchor,
                width: normalizedStoredLayout.width,
                height: normalizedStoredLayout.height,
            }
        }

        return true
    }, [
        applyViewportResolvedLayout,
        containerSize,
        contentMinHeight,
        displayStyle,
        itemIds,
        minResizedHeight,
        onLayoutCommit,
        panelRef,
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
        const panelSize = getLayoutPanelSize()

        if (containerSize.width === 0) {
            return
        }

        positionAnchorRef.current = absoluteToEdgeAnchor(left, top, containerSize, panelSize)
    }, [containerSize, getLayoutPanelSize])

    const getBoundedPanelPosition = useCallback((left, top) => {
        const panelSize = getLayoutPanelSize()
        const bounds = getPanelBoundsForViewport(containerSize, panelSize)
        const fabAwareBounds = {
            ...bounds,
            maxLeft: Math.min(
                bounds.maxLeft,
                getFabAwareMaxLeftForPanelTop(top, panelSize, containerSize, bounds.minLeft),
            ),
        }

        return clampPositionClearOfSettingsFab(
            resolveEdgeAnchoredPosition(
                absoluteToEdgeAnchor(left, top, containerSize, panelSize),
                containerSize,
                panelSize,
                fabAwareBounds,
            ),
            panelSize,
            containerSize,
            fabAwareBounds,
        )
    }, [containerSize, getLayoutPanelSize])

    useLayoutEffect(() => {
        runPositionSync(true)
    }, [displayStyle, itemIds, runPositionSync, storedAnchor, storedHeight, storedWidth])

    useLayoutEffect(() => {
        const shouldCommitCorrections = !isResizing

        if (!runPositionSync(shouldCommitCorrections)) {
            const frameRef = requestAnimationFrame(() => {
                runPositionSync(shouldCommitCorrections)
            })

            return () => {
                cancelAnimationFrame(frameRef)
            }
        }

        return undefined
    }, [containerSize, isResizing, resizeGeneration, resizeLayoutTick, runPositionSync])

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

        const currentPosition = positionRef.current
        if (currentPosition) {
            commitPositionAnchor(currentPosition.left, currentPosition.top)

            onLayoutCommit?.({
                anchor: positionAnchorRef.current,
                width: widthRef.current,
                height: heightRef.current,
            })
        }
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
    }, [containerSize, minResizedHeight])

    const handleResizeHandlePointerUp = useCallback((event) => {
        if (resizeStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        resizeStateRef.current = null

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

        const currentPosition = positionRef.current
        if (currentPosition) {
            commitPositionAnchor(currentPosition.left, currentPosition.top)

            onLayoutCommit?.({
                anchor: positionAnchorRef.current,
                width: committedWidth,
                height: committedHeight,
            })
        }
    }, [commitPositionAnchor, containerSize, minResizedHeight, onLayoutCommit])

    return {
        position: displayPosition,
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
