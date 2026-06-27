export const UI_Z_INDEX = {
    MAP: 0,
    MAP_OVERLAY: 1,
    GLASS_PANEL: 10,
    TRACK_MANAGEMENT_WINDOW_BASE: 20,
    CONTEXT_MENU: 30,
    CLASSIFICATION_BAR: 100,
}

const MAX_TRACK_MANAGEMENT_WINDOW_STACK = UI_Z_INDEX.CONTEXT_MENU - UI_Z_INDEX.TRACK_MANAGEMENT_WINDOW_BASE - 1

/** Shared click-to-front stack for draggable map overlays (action panels, performance analytics, etc.). */
export const DRAGGABLE_FLOATING_STACK_BASE = UI_Z_INDEX.GLASS_PANEL
export const DRAGGABLE_FLOATING_STACK_MAX = UI_Z_INDEX.TRACK_MANAGEMENT_WINDOW_BASE - 1
export const MAX_DRAGGABLE_FLOATING_STACK_DEPTH =
    DRAGGABLE_FLOATING_STACK_MAX - DRAGGABLE_FLOATING_STACK_BASE

export function getTrackManagementWindowZIndex(stackIndex) {
    return UI_Z_INDEX.TRACK_MANAGEMENT_WINDOW_BASE + Math.min(stackIndex, MAX_TRACK_MANAGEMENT_WINDOW_STACK)
}

export function getDraggableFloatingZIndex(stackIndex) {
    return DRAGGABLE_FLOATING_STACK_BASE + Math.min(
        Math.max(0, stackIndex),
        MAX_DRAGGABLE_FLOATING_STACK_DEPTH,
    )
}

