import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_CATALOG_BY_ID,
    filterRenderableItemIds,
} from './actionPanelRegistry.js'
import {
    DEFAULT_ACTION_PANEL_WIDTH_PX,
    DEFAULT_ACTION_PANELS_STATE,
} from './actionPanelDefaults.js'
import {edgeAnchorsEqual} from '../tools/map/edgeAnchoredPosition.js'

export const ACTION_PANEL_MIN_WIDTH_PX = 160
export const ACTION_PANEL_MIN_HEIGHT_PX = 120

function clampPanelWidth(width, maxWidth = Number.POSITIVE_INFINITY) {
    const numericWidth = Number(width)

    if (!Number.isFinite(numericWidth)) {
        return DEFAULT_ACTION_PANEL_WIDTH_PX
    }

    return Math.min(
        maxWidth,
        Math.max(ACTION_PANEL_MIN_WIDTH_PX, Math.round(numericWidth)),
    )
}

function normalizePanelHeight(height) {
    if (height === null || height === undefined) {
        return null
    }

    const numericHeight = Number(height)

    if (!Number.isFinite(numericHeight)) {
        return null
    }

    return Math.max(ACTION_PANEL_MIN_HEIGHT_PX, Math.round(numericHeight))
}

function normalizeAnchorOffset(value, fallbackValue) {
    const numericValue = Number(value)

    if (!Number.isFinite(numericValue) || numericValue < 0) {
        return fallbackValue
    }

    return Math.round(numericValue)
}

function normalizeAnchor(anchor, fallbackAnchor) {
    const horizontalEdge = anchor?.horizontal?.edge === 'right' ? 'right' : 'left'
    const verticalEdge = anchor?.vertical?.edge === 'bottom' ? 'bottom' : 'top'

    return {
        horizontal: {
            edge: horizontalEdge,
            offset: normalizeAnchorOffset(
                anchor?.horizontal?.offset,
                fallbackAnchor.horizontal.offset,
            ),
        },
        vertical: {
            edge: verticalEdge,
            offset: normalizeAnchorOffset(
                anchor?.vertical?.offset,
                fallbackAnchor.vertical.offset,
            ),
        },
    }
}

function normalizePanelId(id, index) {
    if (typeof id === 'string' && id.trim().length > 0) {
        return id.trim()
    }

    return `action-panel-${index + 1}`
}

function normalizePanelTitle(title, fallbackTitle) {
    if (typeof title !== 'string') {
        return fallbackTitle
    }

    const trimmedTitle = title.trim()

    return trimmedTitle.length > 0 ? trimmedTitle : fallbackTitle
}

function normalizeDisplayStyle(displayStyle) {
    if (displayStyle === ACTION_PANEL_DISPLAY_STYLES.COMPACT) {
        return ACTION_PANEL_DISPLAY_STYLES.COMPACT
    }

    return ACTION_PANEL_DISPLAY_STYLES.LARGE
}

function normalizeItemIds(itemIds, fallbackItemIds) {
    const filteredItemIds = filterRenderableItemIds(itemIds)

    if (filteredItemIds.length > 0) {
        return filteredItemIds
    }

    return filterRenderableItemIds(fallbackItemIds)
}

function getDefaultLayoutForPanelId(panelId) {
    return DEFAULT_ACTION_PANELS_STATE.layouts[panelId] ?? {
        anchor: DEFAULT_ACTION_PANELS_STATE.layouts[DEFAULT_ACTION_PANELS_STATE.panels[0].id].anchor,
        width: DEFAULT_ACTION_PANEL_WIDTH_PX,
        height: null,
    }
}

function getDefaultPanelById(panelId) {
    return DEFAULT_ACTION_PANELS_STATE.panels.find((panel) => panel.id === panelId) ?? null
}

export function createActionPanelId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `action-panel-${crypto.randomUUID()}`
    }

    return `action-panel-${Date.now()}`
}

export function createDefaultActionPanelLayout() {
    return {
        anchor: {
            horizontal: {edge: 'left', offset: 20},
            vertical: {edge: 'top', offset: 20},
        },
        width: DEFAULT_ACTION_PANEL_WIDTH_PX,
        height: null,
    }
}

export function createEmptyActionPanel({title = 'New Action Panel'} = {}) {
    const id = createActionPanelId()

    return {
        panel: {
            id,
            title,
            displayStyle: ACTION_PANEL_DISPLAY_STYLES.LARGE,
            itemIds: [],
        },
        layout: createDefaultActionPanelLayout(),
    }
}

export function normalizeActionPanelsState(state) {
    const sourcePanels = Array.isArray(state?.panels) ? state.panels : DEFAULT_ACTION_PANELS_STATE.panels
    const sourceLayouts = state?.layouts ?? DEFAULT_ACTION_PANELS_STATE.layouts

    const panels = sourcePanels.map((panel, index) => {
        const fallbackPanel = getDefaultPanelById(panel?.id) ?? DEFAULT_ACTION_PANELS_STATE.panels[0]
        const id = normalizePanelId(panel?.id, index)

        return {
            id,
            title: normalizePanelTitle(panel?.title, fallbackPanel.title),
            displayStyle: normalizeDisplayStyle(panel?.displayStyle),
            itemIds: normalizeItemIds(panel?.itemIds, fallbackPanel.itemIds),
        }
    })

    const layouts = {}

    panels.forEach((panel) => {
        const fallbackLayout = getDefaultLayoutForPanelId(panel.id)
        const storedLayout = sourceLayouts?.[panel.id] ?? fallbackLayout

        layouts[panel.id] = {
            anchor: normalizeAnchor(storedLayout?.anchor, fallbackLayout.anchor),
            width: clampPanelWidth(storedLayout?.width ?? fallbackLayout.width),
            height: normalizePanelHeight(storedLayout?.height ?? fallbackLayout.height),
        }
    })

    return {
        panels,
        layouts,
    }
}

export function actionPanelLayoutsEqual(leftLayouts, rightLayouts) {
    const leftKeys = Object.keys(leftLayouts ?? {})
    const rightKeys = Object.keys(rightLayouts ?? {})

    if (leftKeys.length !== rightKeys.length) {
        return false
    }

    return leftKeys.every((panelId) => {
        const leftLayout = leftLayouts[panelId]
        const rightLayout = rightLayouts[panelId]

        if (!rightLayout) {
            return false
        }

        return edgeAnchorsEqual(leftLayout.anchor, rightLayout.anchor)
            && leftLayout.width === rightLayout.width
            && leftLayout.height === rightLayout.height
    })
}

export {clampPanelWidth, normalizePanelHeight}
