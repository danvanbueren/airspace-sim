'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { useCursorHooks } from '../../hooks/useCursorHooks'
import { useKeyboardCameraControls } from '../../hooks/useKeyboardCameraControls'
import { useMapCursor } from '../../hooks/useMapCursor'
import { useMapInteractionGuards } from '../../hooks/useMapInteractionGuards'
import { useMapLibreMap } from '../../hooks/useMapLibreMap'
import { useMapResize } from '../../hooks/useMapResize'
import { useMapStyle } from '../../hooks/useMapStyle'
import { useMeasuredElementSize } from '../../hooks/useMeasuredElementSize'
import { useBearingRangeTool } from '../../hooks/useBearingRangeTool'
import MapContextMenu from './MapContextMenu'
import CursorCoordinateOverlay from './CursorCoordinateOverlay'
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLES = {
    light: 'map-styles/voyager-gl-style.json',
    dark: 'map-styles/dark-matter-gl-style.json',
}

export default function MapView({mapInteractionsEnabled = true}) {
    const theme = useTheme()
    const mapContainerRef = useRef(null)
    const cursorBoxRef = useRef(null)
    const contextMenuRef = useRef(null)
    const [currentContextMenuElement, setCurrentContextMenuElement] = useState(null)

    const {mapRef, mapReady} = useMapLibreMap({
        mapContainerRef,
        initialStyle: MAP_STYLES[theme.palette.mode],
    })

    useMapStyle(mapRef, MAP_STYLES[theme.palette.mode])
    useKeyboardCameraControls(mapRef, mapReady && mapInteractionsEnabled)
    useMapCursor(mapRef, mapReady && mapInteractionsEnabled)
    useMapInteractionGuards(mapRef, mapReady && mapInteractionsEnabled)
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
        isDrawingBearingRangeLine,
        lines,
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

    useEffect(() => {
        if (!currentContextMenuElement) return

        const handlePointerDown = (event) => {
            if (contextMenuRef.current?.contains(event.target)) return

            setCurrentContextMenuElement(null)
        }

        document.addEventListener('pointerdown', handlePointerDown)

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown)
        }
    }, [currentContextMenuElement])

    const cursorInfo = useCursorHooks(mapRef, mapReady && mapInteractionsEnabled, mapContainerRef)
    const visibleCursorInfo = isDrawingBearingRangeLine ? null : cursorInfo
    const cursorBoxSize = useMeasuredElementSize(cursorBoxRef, [visibleCursorInfo])
    const contextMenuSize = useMeasuredElementSize(contextMenuRef, [currentContextMenuElement])

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
                cursorInfo={visibleCursorInfo}
                cursorBoxRef={cursorBoxRef}
                cursorBoxSize={cursorBoxSize}
                mapContainerRef={mapContainerRef}
            />

            <MapContextMenu
                ref={contextMenuRef}
                elementContainer={currentContextMenuElement}
                contextMenuSize={contextMenuSize}
                mapContainerRef={mapContainerRef}
                onRemoveBearingRangeLine={handleRemoveBearingRangeLine}
                onClearBearingRangeLines={handleClearBearingRangeLines}
                lines={lines}
            />
        </div>
    )
}