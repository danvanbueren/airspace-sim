import {ACTION_PANEL_DISPLAY_STYLES, filterRenderableItemIds} from './actionPanelRegistry.js'
import {
    ACTION_PANEL_GRID_GAP_COMPACT_PX,
    ACTION_PANEL_GRID_GAP_PX,
    COMPACT_BUTTON_MIN_HEIGHT_PX,
    getCompactGridColumnCount,
    getLargeGridColumnCount,
} from './actionPanelGridLayout.js'
import {ACTION_PANEL_MIN_HEIGHT_PX, ACTION_PANEL_MIN_WIDTH_PX} from './normalizeActionPanels.js'

/** Header row, divider, and card top padding (excluding body grid). */
export const ACTION_PANEL_HEADER_CHROME_PX = 72

/** Extra body padding so the bottom row of controls is not clipped. */
export const ACTION_PANEL_BODY_BOTTOM_PADDING_PX = 24

const LARGE_CONTROL_ROW_PX = 80

export function estimateActionPanelAutoHeight({
    itemIds,
    displayStyle,
    panelWidthPx,
}) {
    const renderableItemIds = filterRenderableItemIds(itemIds)
    const itemCount = renderableItemIds.length

    if (itemCount === 0) {
        return ACTION_PANEL_MIN_HEIGHT_PX
    }

    if (displayStyle === ACTION_PANEL_DISPLAY_STYLES.COMPACT) {
        const columnCount = getCompactGridColumnCount(panelWidthPx, itemCount)
        const rowCount = Math.ceil(itemCount / columnCount)

        return ACTION_PANEL_HEADER_CHROME_PX
            + (rowCount * COMPACT_BUTTON_MIN_HEIGHT_PX)
            + (Math.max(0, rowCount - 1) * ACTION_PANEL_GRID_GAP_COMPACT_PX)
            + ACTION_PANEL_BODY_BOTTOM_PADDING_PX
    }

    const columnCount = getLargeGridColumnCount(panelWidthPx, itemCount)
    const rowCount = Math.ceil(itemCount / columnCount)

    return ACTION_PANEL_HEADER_CHROME_PX
        + (rowCount * LARGE_CONTROL_ROW_PX)
        + (Math.max(0, rowCount - 1) * ACTION_PANEL_GRID_GAP_PX)
        + ACTION_PANEL_BODY_BOTTOM_PADDING_PX
}

export function resolveActionPanelLayoutSize({
    panelRef,
    width,
    height,
    itemIds,
    displayStyle,
    contentMinHeight = ACTION_PANEL_MIN_HEIGHT_PX,
}) {
    const measuredWidth = panelRef.current?.offsetWidth ?? 0
    const measuredHeight = panelRef.current?.offsetHeight ?? 0
    const estimatedAutoHeight = estimateActionPanelAutoHeight({
        itemIds,
        displayStyle,
        panelWidthPx: width,
    })

    const resolvedWidth = Math.max(
        width || measuredWidth || ACTION_PANEL_MIN_WIDTH_PX,
        ACTION_PANEL_MIN_WIDTH_PX,
    )

    const resolvedHeight = height ?? Math.max(
        measuredHeight,
        estimatedAutoHeight,
        contentMinHeight,
    )

    return {
        width: resolvedWidth,
        height: resolvedHeight,
        explicitHeight: height,
    }
}
