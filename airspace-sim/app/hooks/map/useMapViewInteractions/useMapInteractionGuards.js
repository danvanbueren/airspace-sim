import { useEffect } from 'react'

export function useMapInteractionGuards(mapRef, enabled) {
    useEffect(() => {
        if (!enabled || !mapRef.current)
            return

        const map = mapRef.current

        map.dragRotate.disable()
        map.touchZoomRotate.disableRotation()
    }, [mapRef, enabled])
}