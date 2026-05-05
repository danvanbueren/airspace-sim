'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLES = {
    light: 'map-styles/voyager-gl-style.json',
    dark: 'map-styles/dark-matter-gl-style.json',
}

export default function MapView() {

    const theme = useTheme()
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current)
            return

        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            projection: {type: 'globe'},
            style: MAP_STYLES[theme.palette.mode],
            center: [0, 0],
            zoom: 1
        })

        const setDefaultCursor = () => {
            mapRef.current.getCanvas().style.cursor = 'default'
        }

        const setGrabbingCursor = () => {
            mapRef.current.getCanvas().style.cursor = 'grabbing'
        }

        setDefaultCursor()
        mapRef.current.on('mousedown', setGrabbingCursor)
        mapRef.current.on('mouseup', setDefaultCursor)
        mapRef.current.on('dragend', setDefaultCursor)

        mapRef.current.dragRotate.disable()
        mapRef.current.touchZoomRotate.disableRotation()

        const handleWindowResize = () => {
            mapRef.current?.resize()
        }

        const handleContextMenu = (e) => {
            e.preventDefault()
        }

        mapRef.current.on('contextmenu', handleContextMenu)

        window.addEventListener('resize', handleWindowResize)

        mapRef.current.on('load', () => {
            mapRef.current.addSource('point', {
                'type': 'geojson',
                'data': {
                    'type': 'Point',
                    'coordinates': [50, 0]
                }
            })

        })

        return () => {
            window.removeEventListener('resize', handleWindowResize)
            mapRef.current?.off('contextmenu', handleContextMenu)
            mapRef.current?.off('mousedown', setGrabbingCursor)
            mapRef.current?.off('mouseup', setDefaultCursor)
            mapRef.current?.off('dragend', setDefaultCursor)
            mapRef.current?.remove()
            mapRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!mapRef.current)
            return

        mapRef.current.setStyle(MAP_STYLES[theme.palette.mode])
    }, [theme.palette.mode])

    return (
        <>
            <div
                ref={mapContainerRef}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
        </>
    )
}