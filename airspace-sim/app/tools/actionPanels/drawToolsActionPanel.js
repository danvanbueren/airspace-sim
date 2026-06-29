import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_IDS,
} from './actionPanelRegistry.js'
import {estimateActionPanelAutoHeight} from './actionPanelSizeEstimate.js'
import {absoluteToEdgeAnchor, clampAbsolutePosition} from '../map/edgeAnchoredPosition.js'

export const DRAW_TOOLS_PANEL_TITLE = 'Draw Tools'

export const DRAW_TOOLS_PANEL_WIDTH_PX = 280

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

function getMapContainerSize(mapContainerRef) {
    return {
        width: mapContainerRef.current?.clientWidth ?? window.innerWidth,
        height: mapContainerRef.current?.clientHeight ?? window.innerHeight,
    }
}

export function estimateDrawToolsPanelHeight() {
    return estimateActionPanelAutoHeight({
        itemIds: DRAW_TOOLS_DEFAULT_ITEM_IDS,
        displayStyle: ACTION_PANEL_DISPLAY_STYLES.COMPACT,
        panelWidthPx: DRAW_TOOLS_PANEL_WIDTH_PX,
    })
}

export function computeDrawToolsPanelPosition(elementContainer, mapContainerRef) {
    const containerSize = getMapContainerSize(mapContainerRef)
    const panelWidth = DRAW_TOOLS_PANEL_WIDTH_PX
    const panelHeight = estimateDrawToolsPanelHeight()
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
        height: null,
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
