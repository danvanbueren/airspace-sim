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

    // INITIALIZE ON MOUNT
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current)
            return

        // INITIALIZE MAP
        mapRef.current = new maplibregl.Map({
            container: mapContainerRef.current,
            projection: {type: 'globe'},
            style: MAP_STYLES[theme.palette.mode],
            center: [0, 0],
            zoom: 1
        })

        // HANDLE MAP LOAD
        const handleMapLoad = () => { setMapReady(true) }
        mapRef.current.on('load', handleMapLoad)

        // WASD KEYS
        const pressedKeys = new Set()
        let animationFrameId = null
        let lastFrameTime = null

        // CAMERA MOVEMENT VIA WASD
        const moveCamera = (timestamp) => {
            if (!mapRef.current) {
                animationFrameId = null
                return
            }

            if (lastFrameTime === null)
                lastFrameTime = timestamp

            const deltaSeconds = (timestamp - lastFrameTime) / 1000
            lastFrameTime = timestamp

            const slowPanSpeed = 500
            const fastPanSpeed = 2000
            const panSpeed = pressedKeys.has('shift') ? slowPanSpeed : fastPanSpeed
            let x = 0
            let y = 0

            if (pressedKeys.has('w'))
                y -= 1
            if (pressedKeys.has('a'))
                x -= 1
            if (pressedKeys.has('s'))
                y += 1
            if (pressedKeys.has('d'))
                x += 1

            if (x !== 0 || y !== 0) {
                const length = Math.sqrt(x * x + y * y)

                mapRef.current.panBy([
                    (x / length) * panSpeed * deltaSeconds,
                    (y / length) * panSpeed * deltaSeconds,
                ], {duration: 0})

                animationFrameId = window.requestAnimationFrame(moveCamera)
            } else {
                animationFrameId = null
                lastFrameTime = null
            }
        }

        const startCameraMovement = () => {
            if (animationFrameId === null)
                animationFrameId = window.requestAnimationFrame(moveCamera)
        }

        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase()

            if (!['w', 'a', 's', 'd', 'shift'].includes(key))
                return

            e.preventDefault()
            pressedKeys.add(key)
            startCameraMovement()
        }

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase()

            if (!['w', 'a', 's', 'd', 'shift'].includes(key))
                return

            e.preventDefault()
            pressedKeys.delete(key)
        }

        // LISTEN FOR WASD
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        // HANDLE CURSOR
        const setDefaultCursor = () => { mapRef.current.getCanvas().style.cursor = 'crosshair' }
        const setCustomCursor = (e) => {
            if (e.originalEvent.buttons === 1)
                mapRef.current.getCanvas().style.cursor = 'grabbing'
            if (e.originalEvent.buttons === 2)
                mapRef.current.getCanvas().style.cursor = 'pointer'
        }
        setDefaultCursor()
        mapRef.current.on('mousedown', setCustomCursor)
        mapRef.current.on('mouseup', setDefaultCursor)
        mapRef.current.on('dragend', setDefaultCursor)

        // DISABLE ROTATION WITH RIGHT MOUSE CLICK
        mapRef.current.dragRotate.disable()
        mapRef.current.touchZoomRotate.disableRotation()

        // DISABLE RIGHT CLICK CONTEXT MENU
        const handleContextMenu = (e) => { e.preventDefault() }
        mapRef.current.on('contextmenu', handleContextMenu)

        // HANDLE WINDOW RESIZE
        const handleWindowResize = () => { mapRef.current?.resize() }
        window.addEventListener('resize', handleWindowResize)

        // CLEAN UP LISTENERS
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)

            if (animationFrameId !== null)
                window.cancelAnimationFrame(animationFrameId)

            window.removeEventListener('resize', handleWindowResize)
            mapRef.current?.off('load', handleMapLoad)
            mapRef.current?.off('contextmenu', handleContextMenu)
            mapRef.current?.off('mousedown', setCustomCursor)
            mapRef.current?.off('mouseup', setDefaultCursor)
            mapRef.current?.off('dragend', setDefaultCursor)
            mapRef.current?.remove()
            mapRef.current = null
            setMapReady(false)
        }
    }, [])

    // UPDATE MAP STYLE ON THEME CHANGE
    useEffect(() => {
        if (!mapRef.current)
            return

        mapRef.current.setStyle(MAP_STYLES[theme.palette.mode])
    }, [theme.palette.mode])

    // UPDATE CURSOR BOX SIZE
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