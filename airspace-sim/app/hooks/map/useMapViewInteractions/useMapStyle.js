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

export function useMapStyle(mapRef, style) {
    const previousStyleRef = useRef(style)

    useEffect(() => {
        const map = mapRef.current

        if (!map) {
            return
        }

        const handleStyleLoad = () => {
            applyWaterLabelPaint(map, style)
        }

        if (previousStyleRef.current === style) {
            return scheduleWaterLabelPaint(map, handleStyleLoad)
        }

        previousStyleRef.current = style

        const applyStyleChange = () => {
            map.on('style.load', handleStyleLoad)
            map.setStyle(style)
            map.once('idle', handleStyleLoad)
        }

        const cleanupReadyWait = whenStyleReady(map, applyStyleChange)

        return () => {
            cleanupReadyWait()
            map.off('style.load', handleStyleLoad)
            map.off('idle', handleStyleLoad)
        }
    }, [mapRef, style])
}
