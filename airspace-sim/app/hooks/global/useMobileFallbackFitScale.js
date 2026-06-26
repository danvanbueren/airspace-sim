import {useEffect, useState} from 'react'

const MARGIN_RATIO = 0.15

function nearlyEqual(a, b, epsilon = 0.001) {
    return Math.abs(a - b) < epsilon
}

export function useMobileFallbackFitScale(mainRef, contentRef) {
    const [state, setState] = useState({
        scale: 1,
        margins: {horizontal: 0, vertical: 0},
        ready: false,
    })

    useEffect(() => {
        const mainEl = mainRef.current
        const contentEl = contentRef.current

        if (!mainEl || !contentEl) {
            return undefined
        }

        const measure = () => {
            const mainWidth = mainEl.clientWidth
            const mainHeight = mainEl.clientHeight

            if (!mainWidth || !mainHeight) {
                return
            }

            const horizontal = mainWidth * MARGIN_RATIO
            const vertical = mainHeight * MARGIN_RATIO
            const availWidth = mainWidth - (horizontal * 2)
            const availHeight = mainHeight - (vertical * 2)

            const contentWidth = contentEl.offsetWidth
            const contentHeight = contentEl.offsetHeight

            if (!contentWidth || !contentHeight || !availWidth || !availHeight) {
                return
            }

            const scale = Math.min(
                availWidth / contentWidth,
                availHeight / contentHeight,
            )

            setState((previous) => {
                const next = {
                    scale,
                    margins: {horizontal, vertical},
                    ready: true,
                }

                if (
                    previous.ready === next.ready
                    && nearlyEqual(previous.scale, next.scale)
                    && nearlyEqual(previous.margins.horizontal, next.margins.horizontal, 1)
                    && nearlyEqual(previous.margins.vertical, next.margins.vertical, 1)
                ) {
                    return previous
                }

                return next
            })
        }

        measure()

        const observer = new ResizeObserver(measure)
        observer.observe(mainEl)
        observer.observe(contentEl)

        return () => observer.disconnect()
    }, [contentRef, mainRef])

    return state
}
