import {useEffect} from 'react'
import {applyWaterLabelPaint} from '../../../tools/map/mapWaterLabelPaint'

export function useMapStyle(mapRef, style) {
    useEffect(() => {
        const map = mapRef.current

        if (!map) {
            return
        }

        const handleStyleLoad = () => {
            applyWaterLabelPaint(map, style)
        }

        map.on('style.load', handleStyleLoad)
        map.setStyle(style)
        map.once('idle', handleStyleLoad)

        return () => {
            map.off('style.load', handleStyleLoad)
        }
    }, [mapRef, style])
}