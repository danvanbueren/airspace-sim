import { useEffect } from 'react'

export function useMapResize(mapRef, enabled) {
    useEffect(() => {
        if (!enabled)
            return

        const handleWindowResize = () => {
            mapRef.current?.resize()
        }

        window.addEventListener('resize', handleWindowResize)

        return () => {
            window.removeEventListener('resize', handleWindowResize)
        }
    }, [mapRef, enabled])
}