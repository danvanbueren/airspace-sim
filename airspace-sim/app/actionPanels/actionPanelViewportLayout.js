import {
    MAP_GLASS_INSET_PX,
    MAP_OVERLAY_DRAG_MIN_EDGE_PX,
} from '../constants/mapUiLayout.js'
import {
    absoluteToEdgeAnchor,
    edgeAnchorsEqual,
    resolveEdgeAnchoredPosition,
} from '../tools/map/edgeAnchoredPosition.js'
import {clampPositionClearOfSettingsFab} from '../tools/map/settingsFabReserve.js'
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
            containerSize.width - panelSize.width - MAP_GLASS_INSET_PX,
        ),
        maxTop: Math.max(
            MAP_OVERLAY_DRAG_MIN_EDGE_PX,
            containerSize.height - panelSize.height - MAP_GLASS_INSET_PX,
        ),
    }
}

export function resolveClampedPanelPosition(anchor, containerSize, panelSize) {
    if (!anchor || containerSize.width <= 0 || containerSize.height <= 0) {
        return null
    }

    return clampPositionClearOfSettingsFab(
        resolveEdgeAnchoredPosition(
            anchor,
            containerSize,
            panelSize,
            getPanelBoundsForViewport(containerSize, panelSize),
        ),
        panelSize,
        containerSize,
        getPanelBoundsForViewport(containerSize, panelSize),
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

export function normalizeLayoutForViewport(
    layout,
    containerSize,
    {
        contentMinHeight = ACTION_PANEL_MIN_HEIGHT_PX,
        minResizedHeight = contentMinHeight,
        resolvedPanelSize = null,
    } = {},
) {
    if (!layout?.anchor || containerSize.width <= 0 || containerSize.height <= 0) {
        return null
    }

    const maxWidth = Math.max(
        ACTION_PANEL_MIN_WIDTH_PX,
        containerSize.width - MAP_GLASS_INSET_PX - MAP_OVERLAY_DRAG_MIN_EDGE_PX,
    )
    const maxHeight = Math.max(
        minResizedHeight,
        containerSize.height - MAP_GLASS_INSET_PX - MAP_OVERLAY_DRAG_MIN_EDGE_PX,
    )

    const normalizedWidth = clampPanelWidth(layout.width, maxWidth)
    const normalizedHeight = clampExplicitPanelHeight(
        layout.height,
        maxHeight,
        minResizedHeight,
    )

    const panelSize = resolvedPanelSize ?? {
        width: normalizedWidth,
        height: normalizedHeight ?? contentMinHeight,
    }

    const position = resolveClampedPanelPosition(layout.anchor, containerSize, panelSize)

    if (!position) {
        return null
    }

    const normalizedAnchor = absoluteToEdgeAnchor(
        position.left,
        position.top,
        containerSize,
        panelSize,
    )

    return {
        anchor: normalizedAnchor,
        width: normalizedWidth,
        height: normalizedHeight,
        position,
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
                containerSize.width - MAP_GLASS_INSET_PX * 2,
            ),
            maxHeight: Math.max(
                minResizedHeight,
                containerSize.height - MAP_GLASS_INSET_PX * 2,
            ),
        }
    }

    return {
        maxWidth: Math.max(
            ACTION_PANEL_MIN_WIDTH_PX,
            containerSize.width - position.left - MAP_GLASS_INSET_PX,
        ),
        maxHeight: Math.max(
            minResizedHeight,
            containerSize.height - position.top - MAP_GLASS_INSET_PX,
        ),
    }
}
