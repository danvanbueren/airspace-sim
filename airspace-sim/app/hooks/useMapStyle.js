import { useEffect } from 'react'

export function useMapStyle(mapRef, style) {
    useEffect(() => {
        if (!mapRef.current)
            return

        mapRef.current.setStyle(style)
    }, [mapRef, style])
}