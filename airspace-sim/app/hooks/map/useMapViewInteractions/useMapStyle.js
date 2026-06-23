import {useEffect, useRef} from 'react'
import {applyWaterLabelPaint} from '../../../tools/map/mapWaterLabelPaint'

function scheduleWaterLabelPaint(map, style, handleStyleLoad) {
    map.on('style.load', handleStyleLoad)

    if (map.isStyleLoaded()) {
        handleStyleLoad()
        return
    }

    map.once('idle', handleStyleLoad)
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
            scheduleWaterLabelPaint(map, style, handleStyleLoad)

            return () => {
                map.off('style.load', handleStyleLoad)
            }
        }

        previousStyleRef.current = style

        const applyStyleChange = () => {
            map.on('style.load', handleStyleLoad)
            map.setStyle(style)
            map.once('idle', handleStyleLoad)
        }

        if (!map.isStyleLoaded()) {
            map.once('load', applyStyleChange)

            return () => {
                map.off('load', applyStyleChange)
                map.off('style.load', handleStyleLoad)
            }
        }

        applyStyleChange()

        return () => {
            map.off('style.load', handleStyleLoad)
        }
    }, [mapRef, style])
}
