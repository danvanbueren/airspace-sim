/**
 * Resolves the map workspace size from a container ref, falling back to the
 * viewport when the ref is not measured yet (common on the first client render).
 */
export function getWorkspaceContainerSize(containerRef) {
    const container = containerRef?.current

    if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        return {
            width: container.clientWidth,
            height: container.clientHeight,
        }
    }

    if (typeof window !== 'undefined') {
        return {
            width: window.innerWidth,
            height: Math.max(window.innerHeight - 80, 1),
        }
    }

    return {
        width: container?.clientWidth ?? 0,
        height: container?.clientHeight ?? 0,
    }
}
