'use client'

import { useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import 'maplibre-gl/dist/maplibre-gl.css'
import CursorCoordinateOverlay from './CursorCoordinateOverlay'
import { useCursorHooks } from '../hooks/useCursorHooks'
import { useKeyboardCameraControls } from '../hooks/useKeyboardCameraControls'
import { useMapCursor } from '../hooks/useMapCursor'
import { useMapInteractionGuards } from '../hooks/useMapInteractionGuards'
import { useMapLibreMap } from '../hooks/useMapLibreMap'
import { useMapResize } from '../hooks/useMapResize'
import { useMapStyle } from '../hooks/useMapStyle'
import { useMeasuredElementSize } from '../hooks/useMeasuredElementSize'

const MAP_STYLES = {
    light: 'map-styles/voyager-gl-style.json',
    dark: 'map-styles/dark-matter-gl-style.json',
}

export default function MapView() {
    const theme = useTheme()
    const mapContainerRef = useRef(null)
    const cursorBoxRef = useRef(null)

    const {mapRef, mapReady} = useMapLibreMap({
        mapContainerRef,
        initialStyle: MAP_STYLES[theme.palette.mode],
    })

    useMapStyle(mapRef, MAP_STYLES[theme.palette.mode])
    useKeyboardCameraControls(mapRef, mapReady)
    useMapCursor(mapRef, mapReady)
    useMapInteractionGuards(mapRef, mapReady)
    useMapResize(mapRef, mapReady)

    const cursorInfo = useCursorHooks(mapRef, mapReady, mapContainerRef)
    const cursorBoxSize = useMeasuredElementSize(cursorBoxRef, [cursorInfo])

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