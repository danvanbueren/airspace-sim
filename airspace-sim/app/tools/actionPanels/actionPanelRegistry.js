import {SENSOR_DISPLAY_TOGGLES} from '../../simulation/constants.js'

export const ACTION_PANEL_ITEM_TYPES = {
    TOGGLE: 'toggle',
    BUTTON: 'button',
}

export const ACTION_PANEL_DISPLAY_STYLES = {
    LARGE: 'large',
    COMPACT: 'compact',
}

export const ACTION_PANEL_ITEM_IDS = {
    IFF_CURRENT: SENSOR_DISPLAY_TOGGLES.IFF_CURRENT,
    IFF_HISTORY: SENSOR_DISPLAY_TOGGLES.IFF_HISTORY,
    RADAR_CURRENT: SENSOR_DISPLAY_TOGGLES.RADAR_CURRENT,
    RADAR_HISTORY: SENSOR_DISPLAY_TOGGLES.RADAR_HISTORY,
    AIRPORTS: SENSOR_DISPLAY_TOGGLES.AIRPORTS,
    AIR_ROUTES: SENSOR_DISPLAY_TOGGLES.AIR_ROUTES,
    INITIATE: 'INITIATE',
    RE_INITIATE: 'RE_INITIATE',
    ZOOM_IN: 'ZOOM_IN',
    ZOOM_OUT: 'ZOOM_OUT',
    HOME: 'HOME',
    CENTER_E3: 'CENTER_E3',
    DRAW_RECTANGLE: 'DRAW_RECTANGLE',
    DRAW_SQUARE: 'DRAW_SQUARE',
    DRAW_CIRCLE: 'DRAW_CIRCLE',
    DRAW_OVAL: 'DRAW_OVAL',
    DRAW_RACETRACK: 'DRAW_RACETRACK',
    DRAW_POLYGON: 'DRAW_POLYGON',
}

function formatActionLabel(itemId) {
    return itemId.replaceAll('_', ' ')
}

/** Catalog of assignable panel items. */
export const ACTION_PANEL_ITEM_CATALOG = [
    {
        id: ACTION_PANEL_ITEM_IDS.IFF_CURRENT,
        type: ACTION_PANEL_ITEM_TYPES.TOGGLE,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.IFF_CURRENT),
        toggleKey: ACTION_PANEL_ITEM_IDS.IFF_CURRENT,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.IFF_HISTORY,
        type: ACTION_PANEL_ITEM_TYPES.TOGGLE,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.IFF_HISTORY),
        toggleKey: ACTION_PANEL_ITEM_IDS.IFF_HISTORY,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.RADAR_CURRENT,
        type: ACTION_PANEL_ITEM_TYPES.TOGGLE,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.RADAR_CURRENT),
        toggleKey: ACTION_PANEL_ITEM_IDS.RADAR_CURRENT,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.RADAR_HISTORY,
        type: ACTION_PANEL_ITEM_TYPES.TOGGLE,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.RADAR_HISTORY),
        toggleKey: ACTION_PANEL_ITEM_IDS.RADAR_HISTORY,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.AIRPORTS,
        type: ACTION_PANEL_ITEM_TYPES.TOGGLE,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.AIRPORTS),
        toggleKey: ACTION_PANEL_ITEM_IDS.AIRPORTS,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.AIR_ROUTES,
        type: ACTION_PANEL_ITEM_TYPES.TOGGLE,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.AIR_ROUTES),
        toggleKey: ACTION_PANEL_ITEM_IDS.AIR_ROUTES,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.INITIATE,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.INITIATE),
        actionKey: ACTION_PANEL_ITEM_IDS.INITIATE,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.RE_INITIATE,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: 'RE-INITIATE',
        actionKey: ACTION_PANEL_ITEM_IDS.RE_INITIATE,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.ZOOM_IN,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.ZOOM_IN),
        actionKey: ACTION_PANEL_ITEM_IDS.ZOOM_IN,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.ZOOM_OUT,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.ZOOM_OUT),
        actionKey: ACTION_PANEL_ITEM_IDS.ZOOM_OUT,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.HOME,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.HOME),
        actionKey: ACTION_PANEL_ITEM_IDS.HOME,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.CENTER_E3,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: formatActionLabel(ACTION_PANEL_ITEM_IDS.CENTER_E3),
        actionKey: ACTION_PANEL_ITEM_IDS.CENTER_E3,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.DRAW_RECTANGLE,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: 'Rectangle',
        actionKey: ACTION_PANEL_ITEM_IDS.DRAW_RECTANGLE,
        iconKey: ACTION_PANEL_ITEM_IDS.DRAW_RECTANGLE,
        disabled: true,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.DRAW_SQUARE,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: 'Square',
        actionKey: ACTION_PANEL_ITEM_IDS.DRAW_SQUARE,
        iconKey: ACTION_PANEL_ITEM_IDS.DRAW_SQUARE,
        disabled: true,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.DRAW_CIRCLE,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: 'Circle',
        actionKey: ACTION_PANEL_ITEM_IDS.DRAW_CIRCLE,
        iconKey: ACTION_PANEL_ITEM_IDS.DRAW_CIRCLE,
        disabled: true,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.DRAW_OVAL,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: 'Oval',
        actionKey: ACTION_PANEL_ITEM_IDS.DRAW_OVAL,
        iconKey: ACTION_PANEL_ITEM_IDS.DRAW_OVAL,
        disabled: true,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.DRAW_RACETRACK,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: 'Racetrack',
        actionKey: ACTION_PANEL_ITEM_IDS.DRAW_RACETRACK,
        iconKey: ACTION_PANEL_ITEM_IDS.DRAW_RACETRACK,
        disabled: true,
    },
    {
        id: ACTION_PANEL_ITEM_IDS.DRAW_POLYGON,
        type: ACTION_PANEL_ITEM_TYPES.BUTTON,
        label: 'Polygon',
        actionKey: ACTION_PANEL_ITEM_IDS.DRAW_POLYGON,
        iconKey: ACTION_PANEL_ITEM_IDS.DRAW_POLYGON,
        disabled: true,
    },
]

export const ACTION_PANEL_ITEM_CATALOG_BY_ID = Object.fromEntries(
    ACTION_PANEL_ITEM_CATALOG.map((entry) => [entry.id, entry]),
)

export const ACTION_PANEL_ASSIGNABLE_ITEMS = ACTION_PANEL_ITEM_CATALOG

export function getActionPanelItemDefinition(itemId) {
    return ACTION_PANEL_ITEM_CATALOG_BY_ID[itemId] ?? null
}

export function filterRenderableItemIds(itemIds) {
    if (!Array.isArray(itemIds)) {
        return []
    }

    return itemIds.filter((itemId) => ACTION_PANEL_ITEM_CATALOG_BY_ID[itemId])
}

export function getAvailableAssignableItems(existingItemIds) {
    const usedIds = new Set(existingItemIds ?? [])

    return ACTION_PANEL_ASSIGNABLE_ITEMS.filter((item) => !usedIds.has(item.id))
}
