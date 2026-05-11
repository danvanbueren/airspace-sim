import { useEffect } from 'react'

export function useMapCursor(mapRef, enabled) {
    useEffect(() => {
        if (!mapRef.current)
            return

        const map = mapRef.current

        if (!enabled) {
            map.getCanvas().style.cursor = ''
            return
        }

        const setDefaultCursor = () => {
            map.getCanvas().style.cursor = 'crosshair'
        }

        const setCustomCursor = (e) => {
            if (e.originalEvent.buttons === 1)
                map.getCanvas().style.cursor = 'grabbing'

            if (e.originalEvent.buttons === 2)
                map.getCanvas().style.cursor = 'pointer'
        }

        setDefaultCursor()

        map.on('mousedown', setCustomCursor)
        map.on('mouseup', setDefaultCursor)
        map.on('dragend', setDefaultCursor)

        return () => {
            map.off('mousedown', setCustomCursor)
            map.off('mouseup', setDefaultCursor)
            map.off('dragend', setDefaultCursor)
            map.getCanvas().style.cursor = ''
        }
    }, [mapRef, enabled])
}