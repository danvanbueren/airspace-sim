export function getCursorBoxPosition(cursorBoxSize, cursorInfo, mapContainerRef) {
    if (!cursorInfo)
        return {}

    const offset = 12
    const edgePadding = 8
    const containerWidth = mapContainerRef.current?.clientWidth ?? window.innerWidth
    const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight
    const boxWidth = cursorBoxSize.width
    const boxHeight = cursorBoxSize.height

    let left = cursorInfo.x + offset
    let top = cursorInfo.y + offset

    if (boxWidth && left + boxWidth > containerWidth - edgePadding)
        left = cursorInfo.x - boxWidth - offset

    if (boxHeight && top + boxHeight > containerHeight - edgePadding)
        top = cursorInfo.y - boxHeight - offset

    return {
        left: Math.max(edgePadding, left),
        top: Math.max(edgePadding, top)
    }
}