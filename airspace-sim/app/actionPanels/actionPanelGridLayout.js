export const ACTION_PANEL_GRID_GAP_PX = 16
export const ACTION_PANEL_GRID_GAP_COMPACT_PX = 8
export const ACTION_PANEL_BODY_PADDING_PX = 40

export const LARGE_MIN_COLUMN_WIDTH_PX = 104
export const COMPACT_TOGGLE_MIN_COLUMN_WIDTH_PX = 200
export const COMPACT_BUTTON_MIN_COLUMN_WIDTH_PX = 160

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

export function getMuiGridItemSpan(columnCount) {
    return 12 / columnCount
}

export function getLargeGridColumnCount(panelWidthPx, itemCount) {
    return getResponsiveColumnCount(
        panelWidthPx,
        itemCount,
        LARGE_MIN_COLUMN_WIDTH_PX,
        ACTION_PANEL_GRID_GAP_PX,
    )
}

export function getCompactToggleColumnCount(panelWidthPx, itemCount) {
    return getResponsiveColumnCount(
        panelWidthPx,
        itemCount,
        COMPACT_TOGGLE_MIN_COLUMN_WIDTH_PX,
        ACTION_PANEL_GRID_GAP_COMPACT_PX,
    )
}

export function getCompactButtonColumnCount(panelWidthPx, itemCount) {
    return getResponsiveColumnCount(
        panelWidthPx,
        itemCount,
        COMPACT_BUTTON_MIN_COLUMN_WIDTH_PX,
        ACTION_PANEL_GRID_GAP_COMPACT_PX,
    )
}
