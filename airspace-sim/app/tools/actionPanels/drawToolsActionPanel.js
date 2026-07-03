import {
    ACTION_PANEL_ITEM_IDS,
} from './actionPanelRegistry.js'
import {
    ACTION_PANEL_BODY_PADDING_PX,
    ACTION_PANEL_GRID_GAP_COMPACT_PX,
    COMPACT_BUTTON_MIN_HEIGHT_PX,
} from './actionPanelGridLayout.js'
import {absoluteToEdgeAnchor, clampAbsolutePosition} from '../map/edgeAnchoredPosition.js'

export const DRAW_TOOLS_PANEL_TITLE = 'Draw Tools'

export const DRAW_TOOLS_COMPACT_COLUMN_COUNT = 1

/** Header row, divider, and card top padding (excluding body grid). */
const DRAW_TOOLS_HEADER_CHROME_PX = 84

export const DRAW_TOOLS_DEFAULT_ITEM_IDS = [
    ACTION_PANEL_ITEM_IDS.DRAW_RECTANGLE,
    ACTION_PANEL_ITEM_IDS.DRAW_SQUARE,
    ACTION_PANEL_ITEM_IDS.DRAW_CIRCLE,
    ACTION_PANEL_ITEM_IDS.DRAW_OVAL,
    ACTION_PANEL_ITEM_IDS.DRAW_RACETRACK,
    ACTION_PANEL_ITEM_IDS.DRAW_POLYGON,
]

export const DRAW_TOOL_ITEM_ID_SET = new Set(DRAW_TOOLS_DEFAULT_ITEM_IDS)

const DRAW_TOOLS_PANEL_EDGE_PADDING_PX = 8

const DRAW_TOOLS_PANEL_DEFAULT_WIDTH_PX = 220
const DRAW_TOOLS_PANEL_HEIGHT_SCALE = 1.1

export function estimateDrawToolsPanelWidth() {
    return DRAW_TOOLS_PANEL_DEFAULT_WIDTH_PX
}

export function estimateDrawToolsPanelHeight(panelWidthPx = estimateDrawToolsPanelWidth()) {
    const itemCount = DRAW_TOOLS_DEFAULT_ITEM_IDS.length
    const rowCount = Math.ceil(itemCount / DRAW_TOOLS_COMPACT_COLUMN_COUNT)
    const baseHeight = DRAW_TOOLS_HEADER_CHROME_PX
        + (rowCount * COMPACT_BUTTON_MIN_HEIGHT_PX)
        + (Math.max(0, rowCount - 1) * ACTION_PANEL_GRID_GAP_COMPACT_PX)
        + 140 // Add extra height for the styling section (colors & opacity)

    return Math.ceil(baseHeight * DRAW_TOOLS_PANEL_HEIGHT_SCALE)
}

export function estimateDrawToolsPanelSize() {
    const width = estimateDrawToolsPanelWidth()

    return {
        width,
        height: estimateDrawToolsPanelHeight(width),
    }
}

function getMapContainerSize(mapContainerRef) {
    return {
        width: mapContainerRef.current?.clientWidth ?? window.innerWidth,
        height: mapContainerRef.current?.clientHeight ?? window.innerHeight,
    }
}

export function computeDrawToolsPanelPosition(elementContainer, mapContainerRef) {
    const containerSize = getMapContainerSize(mapContainerRef)
    const {width: panelWidth, height: panelHeight} = estimateDrawToolsPanelSize()
    const panelSize = {width: panelWidth, height: panelHeight}
    const bounds = {
        minLeft: DRAW_TOOLS_PANEL_EDGE_PADDING_PX,
        minTop: DRAW_TOOLS_PANEL_EDGE_PADDING_PX,
        maxLeft: Math.max(
            DRAW_TOOLS_PANEL_EDGE_PADDING_PX,
            containerSize.width - panelWidth - DRAW_TOOLS_PANEL_EDGE_PADDING_PX,
        ),
        maxTop: Math.max(
            DRAW_TOOLS_PANEL_EDGE_PADDING_PX,
            containerSize.height - panelHeight - DRAW_TOOLS_PANEL_EDGE_PADDING_PX,
        ),
    }

    const {left, top} = clampAbsolutePosition(
        elementContainer.x,
        elementContainer.y,
        bounds,
    )

    return {
        anchor: absoluteToEdgeAnchor(left, top, containerSize, panelSize),
        width: panelWidth,
        height: panelHeight,
    }
}

export function isPersistedDrawToolsPanel(panel) {
    if (!panel) {
        return false
    }

    if (panel.title === DRAW_TOOLS_PANEL_TITLE) {
        return true
    }

    if (!Array.isArray(panel.itemIds) || panel.itemIds.length === 0) {
        return false
    }

    return panel.itemIds.every((itemId) => DRAW_TOOL_ITEM_ID_SET.has(itemId))
}

export function stripDrawToolItemIds(itemIds) {
    if (!Array.isArray(itemIds)) {
        return []
    }

    return itemIds.filter((itemId) => !DRAW_TOOL_ITEM_ID_SET.has(itemId))
}
