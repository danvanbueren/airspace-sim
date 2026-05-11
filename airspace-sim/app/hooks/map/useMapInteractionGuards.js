import { useEffect } from 'react'

export function useMapInteractionGuards(mapRef, enabled) {
    useEffect(() => {
        if (!enabled || !mapRef.current)
            return

        const map = mapRef.current

        map.dragRotate.disable()
        map.touchZoomRotate.disableRotation()

        const handleContextMenu = (e) => {
            e.preventDefault()
        }

        map.on('contextmenu', handleContextMenu)

        return () => {
            map.off('contextmenu', handleContextMenu)
        }
    }, [mapRef, enabled])
}