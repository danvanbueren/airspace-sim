'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '@mui/material/styles'
import { useCursorHooks } from '../../hooks/map/useCursorHooks'
import { useKeyboardCameraControls } from '../../hooks/map/useKeyboardCameraControls'
import { useMapCursor } from '../../hooks/map/useMapCursor'
import { useMapInteractionGuards } from '../../hooks/map/useMapInteractionGuards'
import { useMapLibreMap } from '../../hooks/map/useMapLibreMap'
import { useMapResize } from '../../hooks/map/useMapResize'
import { useMapStyle } from '../../hooks/map/useMapStyle'
import { useMeasuredElementSize } from '../../hooks/global/useMeasuredElementSize'
import { useBearingRangeTool } from '../../hooks/map/useBearingRangeTool'
import MapContextMenu from './MapContextMenu'
import CursorCoordinateOverlay from './CursorCoordinateOverlay'
import 'maplibre-gl/dist/maplibre-gl.css'
import {useRemappableMapDragPan} from '@/app/hooks/map/useRemappableMapDragPan'
import {useAlarmAlert} from '@/app/contexts/AlarmAlertContext'

const MAP_STYLES = {
    light: 'map-styles/voyager-gl-style.json',
    dark: 'map-styles/dark-matter-gl-style.json',
}

export default function MapView({mapInteractionsEnabled = true}) {
    const theme = useTheme()
    const {addAlarmAlert} = useAlarmAlert()
    const mapContainerRef = useRef(null)
    const cursorBoxRef = useRef(null)
    const contextMenuRef = useRef(null)
    const [currentContextMenuElement, setCurrentContextMenuElement] = useState(null)

    const {mapRef, mapReady} = useMapLibreMap({
        mapContainerRef,
        initialStyle: MAP_STYLES[theme.palette.mode],
        onError: addAlarmAlert,
    })

    useMapStyle(mapRef, MAP_STYLES[theme.palette.mode])
    useKeyboardCameraControls(mapRef, mapReady && mapInteractionsEnabled)
    useRemappableMapDragPan(mapRef, mapReady && mapInteractionsEnabled)
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