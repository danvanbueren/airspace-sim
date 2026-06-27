import {MAP_GLASS_INSET_PX} from '../constants/mapUiLayout.js'
import {
    ACTION_PANEL_DISPLAY_STYLES,
    ACTION_PANEL_ITEM_IDS,
} from './actionPanelRegistry.js'

export const DEFAULT_CATEGORY_SELECT_PANEL_ID = 'default-category-select'
export const DEFAULT_FIXED_FUNCTION_PANEL_ID = 'default-fixed-function'

export const DEFAULT_ACTION_PANEL_WIDTH_PX = 400

export const DEFAULT_ACTION_PANELS_STATE = {
    panels: [
        {
            id: DEFAULT_CATEGORY_SELECT_PANEL_ID,
            title: 'Category Select Panel',
            displayStyle: ACTION_PANEL_DISPLAY_STYLES.LARGE,
            itemIds: [
                ACTION_PANEL_ITEM_IDS.IFF_CURRENT,
                ACTION_PANEL_ITEM_IDS.IFF_HISTORY,
                ACTION_PANEL_ITEM_IDS.RADAR_CURRENT,
                ACTION_PANEL_ITEM_IDS.RADAR_HISTORY,
                ACTION_PANEL_ITEM_IDS.AIRPORTS,
                ACTION_PANEL_ITEM_IDS.AIR_ROUTES,
                ACTION_PANEL_ITEM_IDS.INITIATE,
                ACTION_PANEL_ITEM_IDS.RE_INITIATE,
            ],
        },
        {
            id: DEFAULT_FIXED_FUNCTION_PANEL_ID,
            title: 'Fixed Function Panel',
            displayStyle: ACTION_PANEL_DISPLAY_STYLES.LARGE,
            itemIds: [
                ACTION_PANEL_ITEM_IDS.ZOOM_IN,
                ACTION_PANEL_ITEM_IDS.ZOOM_OUT,
                ACTION_PANEL_ITEM_IDS.HOME,
                ACTION_PANEL_ITEM_IDS.CENTER_E3,
            ],
        },
    ],
    layouts: {
        [DEFAULT_CATEGORY_SELECT_PANEL_ID]: {
            anchor: {
                horizontal: {edge: 'left', offset: MAP_GLASS_INSET_PX},
                vertical: {edge: 'top', offset: MAP_GLASS_INSET_PX},
            },
            width: DEFAULT_ACTION_PANEL_WIDTH_PX,
            height: null,
        },
        [DEFAULT_FIXED_FUNCTION_PANEL_ID]: {
            anchor: {
                horizontal: {edge: 'left', offset: MAP_GLASS_INSET_PX},
                vertical: {edge: 'bottom', offset: MAP_GLASS_INSET_PX},
            },
            width: DEFAULT_ACTION_PANEL_WIDTH_PX,
            height: null,
        },
    },
}
