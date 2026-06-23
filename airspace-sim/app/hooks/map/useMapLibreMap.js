import {useEffect, useRef, useState} from 'react'
import maplibregl from 'maplibre-gl'

const formatMapLibreErrorMessage = (error) => {
    const message = error?.message ?? 'Unknown map error'

    if (message.includes('Failed to fetch') && message.includes('.mvt')) {
        return `Map tile failed to load: ${message}`
    }

    return `Map error: ${message}`
}

export function useMapLibreMap({mapContainerRef, initialStyle, onError}) {
    const mapRef = useRef(null)
    const initialStyleRef = useRef(initialStyle)
    const onErrorRef = useRef(onError)
    const [mapReady, setMapReady] = useState(false)

    useEffect(() => {
        onErrorRef.current = onError
    }, [onError])

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            projection: {type: 'globe'},
            style: initialStyleRef.current,
            center: [0, 0],
            zoom: 1,
        })

        const handleMapLoad = () => {
            setMapReady(true)
        }

        const handleMapError = (event) => {
            onErrorRef.current?.(formatMapLibreErrorMessage(event.error))
        }

        mapRef.current.on('load', handleMapLoad)
        mapRef.current.on('error', handleMapError)

        return () => {
            mapRef.current?.off('load', handleMapLoad)
            mapRef.current?.off('error', handleMapError)
            mapRef.current?.remove()
            mapRef.current = null
            setMapReady(false)
        }
    }, [mapContainerRef])

    return {mapRef, mapReady, mapCreationStyle: initialStyleRef.current}
}