/**
 * Edge-anchored placement for floating map windows.
 * Stores offset from the nearest horizontal and vertical container edge so
 * windows snap back to the operator's intended position when the viewport expands.
 */

export function absoluteToEdgeAnchor(left, top, containerSize, elementSize) {
    const rightOffset = containerSize.width - elementSize.width - left
    const bottomOffset = containerSize.height - elementSize.height - top

    const useLeft = left <= rightOffset
    const useTop = top <= bottomOffset

    return {
        horizontal: {
            edge: useLeft ? 'left' : 'right',
            offset: useLeft ? left : rightOffset,
        },
        vertical: {
            edge: useTop ? 'top' : 'bottom',
            offset: useTop ? top : bottomOffset,
        },
    }
}

export function edgeAnchorToAbsolute(anchor, containerSize, elementSize) {
    const left = anchor.horizontal.edge === 'left'
        ? anchor.horizontal.offset
        : containerSize.width - elementSize.width - anchor.horizontal.offset

    const top = anchor.vertical.edge === 'top'
        ? anchor.vertical.offset
        : containerSize.height - elementSize.height - anchor.vertical.offset

    return {left, top}
}

export function clampAbsolutePosition(left, top, bounds) {
    return {
        left: Math.min(Math.max(bounds.minLeft, left), bounds.maxLeft),
        top: Math.min(Math.max(bounds.minTop, top), bounds.maxTop),
    }
}

export function resolveEdgeAnchoredPosition(anchor, containerSize, elementSize, bounds) {
    const ideal = edgeAnchorToAbsolute(anchor, containerSize, elementSize)
    return clampAbsolutePosition(ideal.left, ideal.top, bounds)
}

export function edgeAnchorsEqual(leftAnchor, rightAnchor) {
    if (!leftAnchor || !rightAnchor) {
        return leftAnchor === rightAnchor
    }

    return leftAnchor.horizontal.edge === rightAnchor.horizontal.edge
        && leftAnchor.horizontal.offset === rightAnchor.horizontal.offset
        && leftAnchor.vertical.edge === rightAnchor.vertical.edge
        && leftAnchor.vertical.offset === rightAnchor.vertical.offset
}
