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

export function panelRectOverlapsSettingsFab(left, top, panelSize, containerSize) {
    const fabLeft = containerSize.width - MAP_SETTINGS_FAB_RESERVE_WIDTH_PX
    const fabTop = MAP_OVERLAY_DRAG_MIN_EDGE_PX
    const fabRight = containerSize.width
    const fabBottom = MAP_SETTINGS_FAB_RESERVE_HEIGHT_PX

    return (
        left < fabRight
        && left + panelSize.width > fabLeft
        && top < fabBottom
        && top + panelSize.height > fabTop
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

    const leftOfFab = containerSize.width
        - MAP_SETTINGS_FAB_RESERVE_WIDTH_PX
        - panelSize.width
        - MAP_GLASS_INSET_PX
    const belowFabTop = MAP_SETTINGS_FAB_RESERVE_HEIGHT_PX

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
