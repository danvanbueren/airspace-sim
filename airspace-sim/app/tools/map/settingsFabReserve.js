import {
    MAP_GLASS_INSET_PX,
    MAP_OVERLAY_DRAG_MIN_EDGE_PX,
    MAP_SETTINGS_FAB_RESERVE_HEIGHT_PX,
    MAP_SETTINGS_FAB_RESERVE_WIDTH_PX,
} from '../../constants/mapUiLayout.js'

function clampWithinBounds(left, top, bounds) {
    return {
        left: Math.min(Math.max(bounds.minLeft, left), bounds.maxLeft),
        top: Math.min(Math.max(bounds.minTop, top), bounds.maxTop),
    }
}

export function getSettingsFabReserveRect(containerSize) {
    return {
        left: containerSize.width - MAP_SETTINGS_FAB_RESERVE_WIDTH_PX,
        top: MAP_OVERLAY_DRAG_MIN_EDGE_PX,
        right: containerSize.width,
        bottom: MAP_SETTINGS_FAB_RESERVE_HEIGHT_PX,
    }
}

export function getFabAwareMaxLeftForPanelTop(top, panelSize, containerSize, minLeft) {
    const defaultMaxLeft = Math.max(
        minLeft,
        containerSize.width - panelSize.width - MAP_GLASS_INSET_PX,
    )
    const fabRect = getSettingsFabReserveRect(containerSize)
    const panelBottom = top + panelSize.height

    if (top >= fabRect.bottom || panelBottom <= fabRect.top) {
        return defaultMaxLeft
    }

    const fabAwareMaxLeft = fabRect.left - panelSize.width - MAP_GLASS_INSET_PX

    return Math.min(defaultMaxLeft, Math.max(minLeft, fabAwareMaxLeft))
}

export function panelRectOverlapsSettingsFab(left, top, panelSize, containerSize) {
    const fabRect = getSettingsFabReserveRect(containerSize)

    return (
        left < fabRect.right
        && left + panelSize.width > fabRect.left
        && top < fabRect.bottom
        && top + panelSize.height > fabRect.top
    )
}

export function clampPositionClearOfSettingsFab(position, panelSize, containerSize, bounds) {
    let nextPosition = clampWithinBounds(position.left, position.top, bounds)

    if (!panelRectOverlapsSettingsFab(
        nextPosition.left,
        nextPosition.top,
        panelSize,
        containerSize,
    )) {
        return nextPosition
    }

    const fabRect = getSettingsFabReserveRect(containerSize)
    const leftOfFab = fabRect.left - panelSize.width - MAP_GLASS_INSET_PX
    const belowFabTop = fabRect.bottom

    if (leftOfFab >= bounds.minLeft) {
        nextPosition = clampWithinBounds(leftOfFab, nextPosition.top, bounds)
    } else {
        nextPosition = clampWithinBounds(nextPosition.left, belowFabTop, bounds)
    }

    if (panelRectOverlapsSettingsFab(
        nextPosition.left,
        nextPosition.top,
        panelSize,
        containerSize,
    )) {
        nextPosition = clampWithinBounds(nextPosition.left, belowFabTop, bounds)
    }

    return nextPosition
}
