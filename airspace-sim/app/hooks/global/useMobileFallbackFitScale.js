import {useEffect, useState} from 'react'

const PHONE_MAX_WIDTH_PX = 599
const TABLET_MARGIN_RATIO = 0.15
const PHONE_MARGIN_PX = 16

function nearlyEqual(a, b, epsilon = 0.001) {
    return Math.abs(a - b) < epsilon
}

function getLayoutProfile(mainWidth) {
    return mainWidth <= PHONE_MAX_WIDTH_PX ? 'phone' : 'tablet'
}

function getMargins(mainWidth, mainHeight, layoutProfile) {
    if (layoutProfile === 'phone') {
        return {
            horizontal: PHONE_MARGIN_PX,
            vertical: PHONE_MARGIN_PX,
        }
    }

    return {
        horizontal: mainWidth * TABLET_MARGIN_RATIO,
        vertical: mainHeight * TABLET_MARGIN_RATIO,
    }
}

export function useMobileFallbackFitScale(mainRef, contentRef) {
    const [state, setState] = useState({
        scale: 1,
        margins: {horizontal: 0, vertical: 0},
        layoutProfile: 'tablet',
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

            const layoutProfile = getLayoutProfile(mainWidth)
            const {horizontal, vertical} = getMargins(mainWidth, mainHeight, layoutProfile)
            const availWidth = mainWidth - (horizontal * 2)
            const availHeight = mainHeight - (vertical * 2)

            const contentWidth = contentEl.offsetWidth
            const contentHeight = contentEl.offsetHeight

            if (!contentWidth || !contentHeight || !availWidth || !availHeight) {
                return
            }

            let scale = Math.min(
                availWidth / contentWidth,
                availHeight / contentHeight,
            )

            if (layoutProfile === 'phone') {
                scale = Math.min(1, scale)
            }

            setState((previous) => {
                const next = {
                    scale,
                    margins: {horizontal, vertical},
                    layoutProfile,
                    ready: true,
                }

                if (
                    previous.ready === next.ready
                    && previous.layoutProfile === next.layoutProfile
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
