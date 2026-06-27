import {edgeAnchorToAbsolute} from '../tools/map/edgeAnchoredPosition.js'
import {ACTION_PANEL_MIN_HEIGHT_PX} from './normalizeActionPanels.js'

export const ACTION_PANEL_GRID_GAP_PX = 16
export const ACTION_PANEL_GRID_GAP_COMPACT_PX = 8
export const ACTION_PANEL_BODY_PADDING_PX = 40

export const LARGE_MIN_COLUMN_WIDTH_PX = 104
export const COMPACT_MIN_COLUMN_WIDTH_PX = 180

export const COMPACT_BUTTON_HORIZONTAL_INSET_PX = 8
export const COMPACT_BUTTON_MIN_HEIGHT_PX = 36

export function getActionPanelInnerWidth(panelWidthPx) {
    return Math.max(0, panelWidthPx - ACTION_PANEL_BODY_PADDING_PX)
}

export function getResponsiveColumnCount(panelWidthPx, itemCount, minColumnWidthPx, gapPx = ACTION_PANEL_GRID_GAP_PX) {
    if (itemCount <= 0) {
        return 1
    }

    const innerWidth = getActionPanelInnerWidth(panelWidthPx)
    const columns = Math.floor((innerWidth + gapPx) / (minColumnWidthPx + gapPx))

    return Math.max(1, Math.min(itemCount, columns))
}

export function getLargeGridColumnCount(panelWidthPx, itemCount) {
    return getResponsiveColumnCount(
        panelWidthPx,
        itemCount,
        LARGE_MIN_COLUMN_WIDTH_PX,
        ACTION_PANEL_GRID_GAP_PX,
    )
}

export function getCompactGridColumnCount(panelWidthPx, itemCount) {
    return getResponsiveColumnCount(
        panelWidthPx,
        itemCount,
        COMPACT_MIN_COLUMN_WIDTH_PX,
        ACTION_PANEL_GRID_GAP_COMPACT_PX,
    )
}

/** @deprecated Use getCompactGridColumnCount */
export function getCompactToggleColumnCount(panelWidthPx, itemCount) {
    return getCompactGridColumnCount(panelWidthPx, itemCount)
}

/** @deprecated Use getCompactGridColumnCount */
export function getCompactButtonColumnCount(panelWidthPx, itemCount) {
    return getCompactGridColumnCount(panelWidthPx, itemCount)
}

export function resolvePanelPositionFromAnchor(anchor, containerSize, panelWidth, panelHeight = null) {
    if (!anchor || containerSize.width <= 0) {
        return null
    }

    const resolvedHeight = panelHeight ?? ACTION_PANEL_MIN_HEIGHT_PX
    const panelSize = {
        width: Math.max(panelWidth, 1),
        height: Math.max(resolvedHeight, 1),
    }

    return edgeAnchorToAbsolute(anchor, containerSize, panelSize)
}
