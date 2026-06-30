import {MAP_FLOATING_WINDOW_EDGE_PADDING} from '../../constants/mapFloatingWindows.js'

export const FLOATING_WINDOW_CASCADE_OFFSET_PX = 32

export const DEFAULT_FLOATING_WINDOW_SPAWN_POSITION = {
    x: 120,
    y: 120,
}

export function getMapFloatingWindowMaxHeight(
    containerHeight,
    edgePadding = MAP_FLOATING_WINDOW_EDGE_PADDING,
) {
    if (!Number.isFinite(containerHeight) || containerHeight <= 0) {
        return undefined
    }

    return Math.max(0, containerHeight - edgePadding * 2)
}

export function getStaggeredFloatingWindowSpawnPosition(
    existingWindows,
    {
        x = DEFAULT_FLOATING_WINDOW_SPAWN_POSITION.x,
        y = DEFAULT_FLOATING_WINDOW_SPAWN_POSITION.y,
        offsetPx = FLOATING_WINDOW_CASCADE_OFFSET_PX,
    } = {},
) {
    let cascadeIndex = 0

    while (existingWindows.some((window) => (
        window.x === x + cascadeIndex * offsetPx
        && window.y === y + cascadeIndex * offsetPx
    ))) {
        cascadeIndex += 1
    }

    return {
        x: x + cascadeIndex * offsetPx,
        y: y + cascadeIndex * offsetPx,
    }
}
