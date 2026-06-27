import {useEffect, useRef} from 'react'
import {applyWaterLabelPaint} from '../../../tools/map/mapWaterLabelPaint'

const STYLE_LABELS = {
    'map-styles/voyager-gl-style.json': 'Voyager',
    'map-styles/dark-matter-gl-style.json': 'Dark Matter',
}

function whenStyleReady(map, callback) {
    if (map.isStyleLoaded()) {
        callback()
        return () => {}
    }

    const tryReady = () => {
        if (!map.isStyleLoaded()) {
            return
        }

        map.off('styledata', tryReady)
        map.off('idle', tryReady)
        callback()
    }

    map.on('styledata', tryReady)
    map.on('idle', tryReady)

    return () => {
        map.off('styledata', tryReady)
        map.off('idle', tryReady)
    }
}

function getLoadedStyleLabel(map) {
    try {
        return map.getStyle()?.name ?? null
    } catch {
        return null
    }
}

function mapMatchesRequestedStyle(map, style) {
    const expectedLabel = STYLE_LABELS[style]

    if (!expectedLabel) {
        return false
    }

    return getLoadedStyleLabel(map) === expectedLabel
}

export function useMapStyle(mapRef, style, mapCreationStyle, mapReady = false) {
    const requestedStyleRef = useRef(null)
    const mapInstanceRef = useRef(null)

    useEffect(() => {
        const map = mapRef.current

        if (!map || !mapReady) {
            return
        }

        if (mapInstanceRef.current !== map) {
            mapInstanceRef.current = map
            requestedStyleRef.current = mapCreationStyle
        }

        let cancelled = false
        const cleanups = []

        const registerCleanup = (cleanup) => {
            if (typeof cleanup === 'function') {
                cleanups.push(cleanup)
            }
        }

        const paint = () => {
            if (!cancelled) {
                applyWaterLabelPaint(map, style)
            }
        }

        const handleStyleLoad = () => {
            paint()
        }

        map.on('style.load', handleStyleLoad)
        registerCleanup(() => map.off('style.load', handleStyleLoad))

        const styleAlreadyApplied = (
            requestedStyleRef.current === style
            && mapMatchesRequestedStyle(map, style)
        )

        if (styleAlreadyApplied) {
            if (map.isStyleLoaded()) {
                paint()
            }

            return () => {
                cancelled = true
                cleanups.forEach((cleanup) => cleanup())
            }
        }

        requestedStyleRef.current = style

        const swapStyle = () => {
            if (cancelled) {
                return
            }

            const onStyleLoaded = () => {
                if (!cancelled) {
                    paint()
                }
            }

            map.once('style.load', onStyleLoaded)
            registerCleanup(() => map.off('style.load', onStyleLoaded))

            try {
                map.setStyle(style, {diff: false})
            } catch {
                map.off('style.load', onStyleLoaded)
                registerCleanup(whenStyleReady(map, swapStyle))
            }
        }

        swapStyle()

        return () => {
            cancelled = true
            cleanups.forEach((cleanup) => cleanup())
        }
    }, [mapRef, style, mapCreationStyle, mapReady])
}
