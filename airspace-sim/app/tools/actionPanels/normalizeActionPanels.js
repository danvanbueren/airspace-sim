import {
    ACTION_PANEL_DISPLAY_STYLES,
    filterRenderableItemIds,
} from './actionPanelRegistry.js'
import {MAP_FLOATING_INSET_PX} from '../../constants/mapUiLayout.js'
import {
    DEFAULT_ACTION_PANELS_STATE,
    DEFAULT_ACTION_PANEL_IDS,
    DEFAULT_ACTION_PANEL_WIDTH_PX,
} from './actionPanelDefaults.js'
import {edgeAnchorsEqual} from '../map/edgeAnchoredPosition.js'
import {
    isPersistedDrawToolsPanel,
    stripDrawToolItemIds,
} from './drawToolsActionPanel.js'

export const ACTION_PANEL_MIN_WIDTH_PX = 200
export const ACTION_PANEL_MIN_HEIGHT_PX = 160
export const ACTION_PANEL_LARGE_MIN_RESIZED_HEIGHT_PX = 200
export const ACTION_PANEL_COMPACT_MIN_RESIZED_HEIGHT_PX = 160
export const ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX = 32

export function getActionPanelMinResizedHeight(displayStyle) {
    if (displayStyle === ACTION_PANEL_DISPLAY_STYLES.COMPACT) {
        return ACTION_PANEL_COMPACT_MIN_RESIZED_HEIGHT_PX
    }

    return ACTION_PANEL_LARGE_MIN_RESIZED_HEIGHT_PX
}

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

function normalizePanelHeight(height, displayStyle = ACTION_PANEL_DISPLAY_STYLES.LARGE) {
    if (height === null || height === undefined) {
        return null
    }

    const numericHeight = Number(height)

    if (!Number.isFinite(numericHeight)) {
        return null
    }

    return Math.max(getActionPanelMinResizedHeight(displayStyle), Math.round(numericHeight))
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

function normalizeItemIds(itemIds, fallbackItemIds, panelId) {
    const filteredItemIds = stripDrawToolItemIds(filterRenderableItemIds(itemIds))

    if (filteredItemIds.length > 0) {
        return filteredItemIds
    }

    if (DEFAULT_ACTION_PANEL_IDS.has(panelId)) {
        return filterRenderableItemIds(fallbackItemIds)
    }

    return []
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
    return createNewActionPanelLayout()
}

export function createNewActionPanelLayout(existingLayouts = {}) {
    const baseOffset = MAP_FLOATING_INSET_PX
    let maxTopLeftOffset = baseOffset - ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX

    Object.values(existingLayouts).forEach((layout) => {
        const anchor = layout?.anchor

        if (anchor?.horizontal?.edge !== 'left' || anchor?.vertical?.edge !== 'top') {
            return
        }

        maxTopLeftOffset = Math.max(
            maxTopLeftOffset,
            normalizeAnchorOffset(anchor.horizontal.offset, baseOffset),
            normalizeAnchorOffset(anchor.vertical.offset, baseOffset),
        )
    })

    const nextOffset = maxTopLeftOffset + ACTION_PANEL_NEW_LAYOUT_OFFSET_STEP_PX

    return {
        anchor: {
            horizontal: {edge: 'left', offset: nextOffset},
            vertical: {edge: 'top', offset: nextOffset},
        },
        width: DEFAULT_ACTION_PANEL_WIDTH_PX,
        height: null,
    }
}

export function createEmptyActionPanel({title = 'New Action Panel', existingLayouts = {}} = {}) {
    const id = createActionPanelId()

    return {
        panel: {
            id,
            title,
            displayStyle: ACTION_PANEL_DISPLAY_STYLES.LARGE,
            itemIds: [],
        },
        layout: createNewActionPanelLayout(existingLayouts),
    }
}

export function normalizeActionPanelsState(state) {
    const sourcePanels = Array.isArray(state?.panels) ? state.panels : DEFAULT_ACTION_PANELS_STATE.panels
    const sourceLayouts = state?.layouts ?? DEFAULT_ACTION_PANELS_STATE.layouts

    const panels = sourcePanels
        .filter((panel) => !isPersistedDrawToolsPanel(panel))
        .map((panel, index) => {
        const fallbackPanel = getDefaultPanelById(panel?.id) ?? DEFAULT_ACTION_PANELS_STATE.panels[0]
        const id = normalizePanelId(panel?.id, index)

        return {
            id,
            title: normalizePanelTitle(panel?.title, fallbackPanel.title),
            displayStyle: normalizeDisplayStyle(panel?.displayStyle),
            itemIds: normalizeItemIds(panel?.itemIds, fallbackPanel.itemIds, id),
        }
    })

    const layouts = {}

    panels.forEach((panel) => {
        const fallbackLayout = getDefaultLayoutForPanelId(panel.id)
        const storedLayout = sourceLayouts?.[panel.id] ?? fallbackLayout

        layouts[panel.id] = {
            anchor: normalizeAnchor(storedLayout?.anchor, fallbackLayout.anchor),
            width: clampPanelWidth(storedLayout?.width ?? fallbackLayout.width),
            height: normalizePanelHeight(
                storedLayout?.height ?? fallbackLayout.height,
                panel.displayStyle,
            ),
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
