import {useEffect, useRef, useState} from 'react'
import maplibregl from 'maplibre-gl'

const formatMapLibreErrorMessage = (error) => {
    const message = error?.message ?? 'Unknown map error'

    if (message.includes('Failed to fetch') && message.includes('.mvt')) {
        return `Map tile failed to load: ${message}`
    }

    return `Map error: ${message}`
}

/** MapLibre opens attribution expanded on load; collapse to the info icon once. */
const collapseMapAttribution = (mapContainer) => {
    const attribution = mapContainer?.querySelector('.maplibregl-ctrl-attrib')
    if (!attribution || attribution.classList.contains('maplibregl-attrib-empty')) {
        return false
    }

    if (attribution.classList.contains('maplibregl-compact-show')) {
        attribution.classList.remove('maplibregl-compact-show')
        attribution.setAttribute('open', '')
    }

    return true
}

export function useMapLibreMap({mapContainerRef, initialStyle, colorMode = 'dark', onError}) {
    const mapRef = useRef(null)
    const initialStyleRef = useRef(initialStyle)
    const onErrorRef = useRef(onError)
    const [mapReady, setMapReady] = useState(false)

    useEffect(() => {
        onErrorRef.current = onError
    }, [onError])

    useEffect(() => {
        const container = mapContainerRef.current
        if (!container) return

        container.dataset.colorMode = colorMode
    }, [mapContainerRef, colorMode])

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        const attributionCollapsedRef = {current: false}

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            projection: {type: 'globe'},
            style: initialStyleRef.current,
            center: [0, 0],
            zoom: 1,
            attributionControl: false,
            pixelRatio: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
        })

        mapRef.current.addControl(
            new maplibregl.AttributionControl({compact: true}),
            'bottom-right',
        )

        const collapseAttributionOnce = () => {
            if (attributionCollapsedRef.current) return

            if (collapseMapAttribution(mapContainerRef.current)) {
                attributionCollapsedRef.current = true
            }
        }

        const handleMapLoad = () => {
            collapseAttributionOnce()
            setMapReady(true)
        }

        const handleSourceData = () => {
            collapseAttributionOnce()
        }

        const handleMapError = (event) => {
            onErrorRef.current?.(formatMapLibreErrorMessage(event.error))
        }

        mapRef.current.on('load', handleMapLoad)
        mapRef.current.on('sourcedata', handleSourceData)
        mapRef.current.on('error', handleMapError)

        return () => {
            mapRef.current?.off('load', handleMapLoad)
            mapRef.current?.off('sourcedata', handleSourceData)
            mapRef.current?.off('error', handleMapError)
            mapRef.current?.remove()
            mapRef.current = null
            setMapReady(false)
        }
    }, [mapContainerRef])

    return {mapRef, mapReady, mapCreationStyle: initialStyleRef.current}
}