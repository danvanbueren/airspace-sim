'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import CursorCoordinateOverlay from "./CursorCoordinateOverlay"
import { useCursorHooks } from "../hooks/useCursorHooks"

const MAP_STYLES = {
    light: 'map-styles/voyager-gl-style.json',
    dark: 'map-styles/dark-matter-gl-style.json',
}

export default function MapView() {

    const theme = useTheme()
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const cursorBoxRef = useRef(null)
    const [mapReady, setMapReady] = useState(false)
    const cursorInfo = useCursorHooks(mapRef, mapReady, mapContainerRef)
    const [cursorBoxSize, setCursorBoxSize] = useState({width: 0, height: 0})

    // Initialize
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

        const handleMapLoad = () => {
            setMapReady(true)
        }

        mapRef.current.on('load', handleMapLoad)

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

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleWindowResize)
            mapRef.current?.off('load', handleMapLoad)
            mapRef.current?.off('contextmenu', handleContextMenu)
            mapRef.current?.off('mousedown', setGrabbingCursor)
            mapRef.current?.off('mouseup', setDefaultCursor)
            mapRef.current?.off('dragend', setDefaultCursor)
            mapRef.current?.remove()
            mapRef.current = null
            setMapReady(false)
        }
    }, [])

    // Update map style based on theme
    useEffect(() => {
        if (!mapRef.current)
            return

        mapRef.current.setStyle(MAP_STYLES[theme.palette.mode])
    }, [theme.palette.mode])

    useEffect(() => {
        if (!cursorBoxRef.current)
            return

        const {width, height} = cursorBoxRef.current.getBoundingClientRect()

        setCursorBoxSize({width, height})
    }, [cursorInfo])

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
            }}
        >
            <div
                ref={mapContainerRef}
                style={{
                    width: '100%',
                    height: '100%',
                }}
            />
            <CursorCoordinateOverlay
                cursorInfo={cursorInfo}
                cursorBoxRef={cursorBoxRef}
                cursorBoxSize={cursorBoxSize}
                mapContainerRef={mapContainerRef}
            />
        </div>
    )
}