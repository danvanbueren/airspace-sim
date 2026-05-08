import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

export function useMapLibreMap({mapContainerRef, initialStyle}) {
    const mapRef = useRef(null)
    const [mapReady, setMapReady] = useState(false)

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current)
            return

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            projection: {type: 'globe'},
            style: initialStyle,
            center: [0, 0],
            zoom: 1,
        })

        const handleMapLoad = () => {
            setMapReady(true)
        }

        mapRef.current.on('load', handleMapLoad)

        return () => {
            mapRef.current?.off('load', handleMapLoad)
            mapRef.current?.remove()
            mapRef.current = null
            setMapReady(false)
        }
    }, [mapContainerRef, initialStyle])

    return {mapRef, mapReady}
}