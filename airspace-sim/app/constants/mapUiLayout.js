/** Matches glass panel inset in `Home.js` (`top` / `right` / `bottom` / `left: 20`). */
export const MAP_GLASS_INSET_PX = 20

/** Minimum inset when dragging floating map overlays (top/left). */
export const MAP_OVERLAY_DRAG_MIN_EDGE_PX = 8

/** Collapsed MapLibre attribution control height plus gap above it. */
export const MAP_ATTRIBUTION_BOTTOM_RESERVE_PX = 36

/** MUI Fab default diameter used by the settings toolbelt toggle. */
export const MAP_SETTINGS_FAB_SIZE_PX = 56

/** Padding around the settings toolbelt card chrome. */
export const MAP_SETTINGS_FAB_CARD_PADDING_PX = 8

/** Top-right width reserve so draggable overlays cannot cover the settings FAB. */
export const MAP_SETTINGS_FAB_RESERVE_WIDTH_PX =
    MAP_GLASS_INSET_PX + MAP_SETTINGS_FAB_SIZE_PX + (MAP_SETTINGS_FAB_CARD_PADDING_PX * 2)

/** Top-right height reserve so draggable overlays cannot cover the settings FAB. */
export const MAP_SETTINGS_FAB_RESERVE_HEIGHT_PX = MAP_SETTINGS_FAB_RESERVE_WIDTH_PX

export const MAP_PERFORMANCE_OVERLAY_BOTTOM_PX =
    MAP_GLASS_INSET_PX + MAP_ATTRIBUTION_BOTTOM_RESERVE_PX
