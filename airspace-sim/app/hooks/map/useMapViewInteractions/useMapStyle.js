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

function scheduleWaterLabelPaint(map, handleStyleLoad) {
    map.on('style.load', handleStyleLoad)

    const cleanupReadyWait = map.isStyleLoaded()
        ? () => {}
        : whenStyleReady(map, handleStyleLoad)

    if (map.isStyleLoaded()) {
        handleStyleLoad()
    }

    return () => {
        map.off('style.load', handleStyleLoad)
        cleanupReadyWait()
    }
}

export function useMapStyle(mapRef, style, mapCreationStyle) {
    const appliedStyleRef = useRef(null)
    const pendingStyleRef = useRef(null)
    const mapInstanceRef = useRef(null)

    useEffect(() => {
        const map = mapRef.current

        if (!map) {
            return
        }

        if (mapInstanceRef.current !== map) {
            mapInstanceRef.current = map
            appliedStyleRef.current = mapCreationStyle
            pendingStyleRef.current = null
        }

        const handleStyleLoad = () => {
            applyWaterLabelPaint(map, style)
        }

        if (appliedStyleRef.current === style) {
            return scheduleWaterLabelPaint(map, handleStyleLoad)
        }

        let cancelled = false
        let confirmStyleApplied = null

        const applyStyleChange = () => {
            if (cancelled || appliedStyleRef.current === style || pendingStyleRef.current === style) {
                return
            }

            pendingStyleRef.current = style

            confirmStyleApplied = () => {
                if (cancelled || pendingStyleRef.current !== style) {
                    return
                }

                appliedStyleRef.current = style
                pendingStyleRef.current = null
                handleStyleLoad()
            }

            map.on('style.load', confirmStyleApplied)
            map.setStyle(style)
            map.once('idle', confirmStyleApplied)
        }

        const cleanupReadyWait = whenStyleReady(map, applyStyleChange)

        return () => {
            cancelled = true

            if (pendingStyleRef.current === style) {
                pendingStyleRef.current = null
            }

            cleanupReadyWait()

            if (confirmStyleApplied) {
                map.off('style.load', confirmStyleApplied)
                map.off('idle', confirmStyleApplied)
            }
        }
    }, [mapRef, style, mapCreationStyle])
}
