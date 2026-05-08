'use client'

import { useCallback, useRef, useState } from 'react'
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
import {useBearingRangeTool} from "@/app/hooks/useBearingRangeTool"
import MapContextMenu from "./MapContextMenu"

const MAP_STYLES = {
    light: 'map-styles/voyager-gl-style.json',
    dark: 'map-styles/dark-matter-gl-style.json',
}

export default function MapView() {
    const theme = useTheme()
    const mapContainerRef = useRef(null)
    const cursorBoxRef = useRef(null)
    const [currentContextMenuElement, setCurrentContextMenuElement] = useState(null)

    const {mapRef, mapReady} = useMapLibreMap({
        mapContainerRef,
        initialStyle: MAP_STYLES[theme.palette.mode],
    })

    useMapStyle(mapRef, MAP_STYLES[theme.palette.mode])
    useKeyboardCameraControls(mapRef, mapReady)
    useMapCursor(mapRef, mapReady)
    useMapInteractionGuards(mapRef, mapReady)
    useMapResize(mapRef, mapReady)

    const handleBearingRangeContextMenu = useCallback(({ point, lngLat, line }) => {
        setCurrentContextMenuElement({
            x: point.x,
            y: point.y,
            lngLat,
            line,
        })
    }, [])

    const {
        removeBearingRangeLine,
        clearBearingRangeLines,
    } = useBearingRangeTool(mapRef, mapReady, {
        onContextMenu: handleBearingRangeContextMenu,
        lineColor: theme.palette.mode === 'dark' ? '#fff' : '#111',
    })

    const handleRemoveBearingRangeLine = useCallback((lineId) => {
        removeBearingRangeLine(lineId)
        setCurrentContextMenuElement(null)
    }, [removeBearingRangeLine])

    const handleClearBearingRangeLines = useCallback(() => {
        clearBearingRangeLines()
        setCurrentContextMenuElement(null)
    }, [clearBearingRangeLines])

    const cursorInfo = useCursorHooks(mapRef, mapReady, mapContainerRef)
    const cursorBoxSize = useMeasuredElementSize(cursorBoxRef, [cursorInfo])

    return (
        <div
            onClick={() => setCurrentContextMenuElement(null)}
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

            <MapContextMenu
                elementContainer={currentContextMenuElement}
                onRemoveBearingRangeLine={handleRemoveBearingRangeLine}
                onClearBearingRangeLines={handleClearBearingRangeLines}
            />
        </div>
    )
}