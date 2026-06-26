import {useEffect, useRef} from 'react'
import {applyWaterLabelPaint} from '../../../tools/map/mapWaterLabelPaint'

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

export function useMapStyle(mapRef, style, mapCreationStyle, mapReady = false) {
    const confirmedStyleRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const requestIdRef = useRef(0)

    useEffect(() => {
        const map = mapRef.current

        if (!map || !mapReady) {
            return
        }

        if (mapInstanceRef.current !== map) {
            mapInstanceRef.current = map
            confirmedStyleRef.current = mapCreationStyle
            requestIdRef.current = 0
        }

        const requestId = ++requestIdRef.current
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

        const confirmStyle = () => {
            if (cancelled || requestId !== requestIdRef.current) {
                return
            }

            confirmedStyleRef.current = style
            paint()
        }

        const handleStyleLoad = () => {
            paint()
        }

        map.on('style.load', handleStyleLoad)
        registerCleanup(() => map.off('style.load', handleStyleLoad))

        if (confirmedStyleRef.current === style) {
            if (map.isStyleLoaded()) {
                paint()
            }

            return () => {
                cancelled = true
                cleanups.forEach((cleanup) => cleanup())
            }
        }

        const trySetStyle = () => {
            if (cancelled || requestId !== requestIdRef.current) {
                return
            }

            if (confirmedStyleRef.current === style) {
                return
            }

            const onNewStyleLoaded = () => {
                confirmStyle()
            }

            map.once('style.load', onNewStyleLoaded)
            registerCleanup(() => map.off('style.load', onNewStyleLoaded))

            try {
                map.setStyle(style, {diff: false})
            } catch {
                map.off('style.load', onNewStyleLoaded)
                registerCleanup(whenStyleReady(map, trySetStyle))
            }
        }

        registerCleanup(whenStyleReady(map, trySetStyle))

        return () => {
            cancelled = true
            cleanups.forEach((cleanup) => cleanup())
        }
    }, [mapRef, style, mapCreationStyle, mapReady])
}
