import {SENSOR_DISPLAY_TOGGLES} from '../simulation/constants.js'

export const ACTION_PANEL_ITEM_TYPES = {
    TOGGLE: 'toggle',
    BUTTON: 'button',
    SPACER: 'spacer',
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
    ZOOM_IN: 'ZOOM_IN',
    ZOOM_OUT: 'ZOOM_OUT',
    HOME: 'HOME',
    CENTER_E3: 'CENTER_E3',
    SPACER: 'SPACER',
}

const SENSOR_TOGGLE_IDS = new Set([
    ACTION_PANEL_ITEM_IDS.IFF_CURRENT,
    ACTION_PANEL_ITEM_IDS.IFF_HISTORY,
    ACTION_PANEL_ITEM_IDS.RADAR_CURRENT,
    ACTION_PANEL_ITEM_IDS.RADAR_HISTORY,
    ACTION_PANEL_ITEM_IDS.AIRPORTS,
    ACTION_PANEL_ITEM_IDS.AIR_ROUTES,
])

const BUTTON_ACTION_IDS = new Set([
    ACTION_PANEL_ITEM_IDS.ZOOM_IN,
    ACTION_PANEL_ITEM_IDS.ZOOM_OUT,
    ACTION_PANEL_ITEM_IDS.HOME,
    ACTION_PANEL_ITEM_IDS.CENTER_E3,
])

function formatActionLabel(itemId) {
    return itemId.replaceAll('_', ' ')
}

/** Catalog of assignable panel items. Spacers are layout-only placeholders. */
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
        id: ACTION_PANEL_ITEM_IDS.SPACER,
        type: ACTION_PANEL_ITEM_TYPES.SPACER,
        label: 'Spacer',
    },
]

export const ACTION_PANEL_ITEM_CATALOG_BY_ID = Object.fromEntries(
    ACTION_PANEL_ITEM_CATALOG.map((entry) => [entry.id, entry]),
)

export const ACTION_PANEL_ASSIGNABLE_ITEMS = ACTION_PANEL_ITEM_CATALOG.filter(
    (entry) => entry.type !== ACTION_PANEL_ITEM_TYPES.SPACER,
)

export function getActionPanelItemDefinition(itemId) {
    return ACTION_PANEL_ITEM_CATALOG_BY_ID[itemId] ?? null
}

export function isSensorToggleItemId(itemId) {
    return SENSOR_TOGGLE_IDS.has(itemId)
}

export function isButtonActionItemId(itemId) {
    return BUTTON_ACTION_IDS.has(itemId)
}

export function isSpacerItemId(itemId) {
    return itemId === ACTION_PANEL_ITEM_IDS.SPACER
}
