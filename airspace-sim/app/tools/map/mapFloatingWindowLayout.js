import {MAP_FLOATING_WINDOW_EDGE_PADDING} from '../../constants/mapFloatingWindows.js'

export function getMapFloatingWindowMaxHeight(
    containerHeight,
    edgePadding = MAP_FLOATING_WINDOW_EDGE_PADDING,
) {
    if (!Number.isFinite(containerHeight) || containerHeight <= 0) {
        return undefined
    }

    return Math.max(0, containerHeight - edgePadding * 2)
}
