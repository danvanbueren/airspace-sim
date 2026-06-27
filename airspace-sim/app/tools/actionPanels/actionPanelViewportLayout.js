import {
    MAP_FLOATING_INSET_PX,
    MAP_OVERLAY_DRAG_MIN_EDGE_PX,
} from '../../constants/mapUiLayout.js'
import {
    absoluteToEdgeAnchor,
    edgeAnchorsEqual,
    resolveEdgeAnchoredPosition,
} from '../map/edgeAnchoredPosition.js'
import {
    clampPositionClearOfSettingsFab,
    getFabAwareMaxLeftForPanelTop,
} from '../map/settingsFabReserve.js'
import {estimateActionPanelAutoHeight} from './actionPanelSizeEstimate.js'
import {
    ACTION_PANEL_MIN_HEIGHT_PX,
    ACTION_PANEL_MIN_WIDTH_PX,
    clampPanelWidth,
} from './normalizeActionPanels.js'

export function createInitialActionPanelPosition({
    storedAnchor,
    storedWidth,
    itemIds,
    displayStyle,
    containerSize,
}) {
    if (!storedAnchor || containerSize.width <= 0 || containerSize.height <= 0) {
        return null
    }

    const width = clampPanelWidth(storedWidth)
    const height = estimateActionPanelAutoHeight({
        itemIds,
        displayStyle,
        panelWidthPx: width,
    })

    return resolveClampedPanelPosition(storedAnchor, containerSize, {
        width,
        height,
    })
}

export function getPanelBoundsForViewport(containerSize, panelSize) {
    return {
        minLeft: MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        minTop: MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        maxLeft: Math.max(
            MAP_OVERLAY_DRAG_MIN_EDGE_PX,
            containerSize.width - panelSize.width - MAP_FLOATING_INSET_PX,
        ),
        maxTop: Math.max(
            MAP_OVERLAY_DRAG_MIN_EDGE_PX,
            containerSize.height - panelSize.height - MAP_FLOATING_INSET_PX,
        ),
    }
}

export function resolveClampedPanelPosition(anchor, containerSize, panelSize) {
    if (!anchor || containerSize.width <= 0 || containerSize.height <= 0) {
        return null
    }

    const bounds = getPanelBoundsForViewport(containerSize, panelSize)
    const idealPosition = resolveEdgeAnchoredPosition(
        anchor,
        containerSize,
        panelSize,
        bounds,
    )
    const fabAwareBounds = {
        ...bounds,
        maxLeft: Math.min(
            bounds.maxLeft,
            getFabAwareMaxLeftForPanelTop(
                idealPosition.top,
                panelSize,
                containerSize,
                bounds.minLeft,
            ),
        ),
    }

    return clampPositionClearOfSettingsFab(
        resolveEdgeAnchoredPosition(
            anchor,
            containerSize,
            panelSize,
            fabAwareBounds,
        ),
        panelSize,
        containerSize,
        fabAwareBounds,
    )
}

function clampExplicitPanelHeight(height, maxHeight, minHeight) {
    if (height === null || height === undefined) {
        return null
    }

    const numericHeight = Number(height)

    if (!Number.isFinite(numericHeight)) {
        return null
    }

    return Math.min(
        maxHeight,
        Math.max(minHeight, Math.round(numericHeight)),
    )
}

export function getViewportPanelDimensionLimits(containerSize, minResizedHeight = ACTION_PANEL_MIN_HEIGHT_PX) {
    return {
        maxWidth: Math.max(
            ACTION_PANEL_MIN_WIDTH_PX,
            containerSize.width - MAP_FLOATING_INSET_PX - MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        ),
        maxHeight: Math.max(
            minResizedHeight,
            containerSize.height - MAP_FLOATING_INSET_PX - MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        ),
    }
}

/**
 * Resolves the visible action-panel layout for the current viewport while
 * preserving the stored edge anchor. Clamping only affects runtime position;
 * the anchor itself stays stable so panels snap back when the viewport expands.
 */
export function resolveViewportLayoutFromAnchor(
    anchor,
    width,
    height,
    containerSize,
    {
        contentMinHeight = ACTION_PANEL_MIN_HEIGHT_PX,
        minResizedHeight = contentMinHeight,
        resolvedPanelSize = null,
    } = {},
) {
    if (!anchor || containerSize.width <= 0 || containerSize.height <= 0) {
        return null
    }

    const {maxWidth, maxHeight} = getViewportPanelDimensionLimits(containerSize, minResizedHeight)
    const normalizedWidth = clampPanelWidth(width, maxWidth)
    const normalizedHeight = clampExplicitPanelHeight(
        height,
        maxHeight,
        minResizedHeight,
    )
    const panelSize = resolvedPanelSize ?? {
        width: normalizedWidth,
        height: normalizedHeight ?? contentMinHeight,
    }
    const position = resolveClampedPanelPosition(anchor, containerSize, panelSize)

    if (!position) {
        return null
    }

    return {
        anchor,
        width: normalizedWidth,
        height: normalizedHeight,
        position,
    }
}

export function normalizeLayoutForViewport(
    layout,
    containerSize,
    {
        contentMinHeight = ACTION_PANEL_MIN_HEIGHT_PX,
        minResizedHeight = contentMinHeight,
        resolvedPanelSize = null,
        preserveAnchor = false,
    } = {},
) {
    const resolvedLayout = resolveViewportLayoutFromAnchor(
        layout?.anchor,
        layout?.width,
        layout?.height,
        containerSize,
        {
            contentMinHeight,
            minResizedHeight,
            resolvedPanelSize,
        },
    )

    if (!resolvedLayout) {
        return null
    }

    if (preserveAnchor) {
        return resolvedLayout
    }

    const panelSize = resolvedPanelSize ?? {
        width: resolvedLayout.width,
        height: resolvedLayout.height ?? contentMinHeight,
    }

    return {
        ...resolvedLayout,
        anchor: absoluteToEdgeAnchor(
            resolvedLayout.position.left,
            resolvedLayout.position.top,
            containerSize,
            panelSize,
        ),
    }
}

export function viewportLayoutDiffersFromStored(storedLayout, normalizedLayout) {
    if (!storedLayout || !normalizedLayout) {
        return false
    }

    return !edgeAnchorsEqual(storedLayout.anchor, normalizedLayout.anchor)
        || storedLayout.width !== normalizedLayout.width
        || storedLayout.height !== normalizedLayout.height
}

export function viewportDimensionsDifferFromStored(storedLayout, normalizedLayout) {
    if (!storedLayout || !normalizedLayout) {
        return false
    }

    return storedLayout.width !== normalizedLayout.width
        || storedLayout.height !== normalizedLayout.height
}

export function runtimeLayoutDiffersFromStored(runtimeLayout, storedLayout) {
    if (!storedLayout?.anchor) {
        return false
    }

    if (!runtimeLayout?.anchor) {
        return true
    }

    return !edgeAnchorsEqual(runtimeLayout.anchor, storedLayout.anchor)
        || runtimeLayout.width !== storedLayout.width
        || runtimeLayout.height !== storedLayout.height
}

export function buildStoredLayoutSnapshot(anchor, width, height) {
    return {
        anchor,
        width,
        height,
    }
}

export function getViewportMaxPanelDimensions(position, containerSize, minResizedHeight) {
    if (!position) {
        return {
            maxWidth: Math.max(
                ACTION_PANEL_MIN_WIDTH_PX,
                containerSize.width - MAP_FLOATING_INSET_PX * 2,
            ),
            maxHeight: Math.max(
                minResizedHeight,
                containerSize.height - MAP_FLOATING_INSET_PX * 2,
            ),
        }
    }

    return {
        maxWidth: Math.max(
            ACTION_PANEL_MIN_WIDTH_PX,
            containerSize.width - position.left - MAP_FLOATING_INSET_PX,
        ),
        maxHeight: Math.max(
            minResizedHeight,
            containerSize.height - position.top - MAP_FLOATING_INSET_PX,
        ),
    }
}
