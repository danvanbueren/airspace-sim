'use client'

import {useCallback, useRef} from 'react'
import {useTheme} from '@mui/material/styles'
import {useCursorHooks} from '../../hooks/map/useCursorHooks'
import {useMapLibreMap} from '../../hooks/map/useMapLibreMap'
import {useMeasuredElementSize} from '../../hooks/global/useMeasuredElementSize'
import {useBearingRangeTool} from '../../hooks/map/useBearingRangeTool'
import {useRegisteredMap} from '../../hooks/map/useRegisteredMap'
import {useMapViewInteractions} from '../../hooks/map/useMapViewInteractions/useMapViewInteractions'
import {useMapContextMenuState} from '../../hooks/map/useMapContextMenuState'
import {useTrackManagementWindows} from '../../hooks/map/useTrackManagementWindows'
import {useTrackMapLayer} from '../../hooks/map/useTrackMapLayer'
import MapContextMenu from './MapContextMenu'
import TrackManagementWindow from '../windows/TrackManagementWindow'
import CursorCoordinateOverlay from './CursorCoordinateOverlay'
import 'maplibre-gl/dist/maplibre-gl.css'
import {useMapState} from '../../contexts/MapStateContext'

const MAP_STYLES = {
    light: 'map-styles/voyager-gl-style.json',
    dark: 'map-styles/dark-matter-gl-style.json',
}

function parseOptionalNumber(value) {
    if (value === '' || value === null || value === undefined) {
        return null
    }

    const number = Number(value)

    return Number.isFinite(number) ? number : null
}

function createTrackFromManagementWindow(trackManagementWindow) {
    return {
        id: trackManagementWindow.trackId,
        trackId: trackManagementWindow.trackId,
        longitude: trackManagementWindow.lngLat.lng,
        latitude: trackManagementWindow.lngLat.lat,
        domain: trackManagementWindow.domain,
        identity: trackManagementWindow.identity,
        type: trackManagementWindow.type,
        heading: parseOptionalNumber(trackManagementWindow.heading) ?? 0,
        speed: parseOptionalNumber(trackManagementWindow.speed),
        altitude: parseOptionalNumber(trackManagementWindow.altitude),
        callsign: trackManagementWindow.callsign || trackManagementWindow.trackId,
    }
}

export default function MapView({mapInteractionsEnabled = true}) {
    const theme = useTheme()
    const {addAlarmAlert, registerMap} = useMapState()
    const mapContainerRef = useRef(null)
    const cursorBoxRef = useRef(null)
    const contextMenuRef = useRef(null)
    const openTrackManagementWindowRef = useRef(null)
    const mapStyle = MAP_STYLES[theme.palette.mode]

    const {mapRef, mapReady} = useMapLibreMap({
        mapContainerRef,
        initialStyle: mapStyle,
        onError: addAlarmAlert,
    })

    const handleMapTrackClick = useCallback((track, event) => {
        openTrackManagementWindowRef.current?.(track, event)
    }, [])

    const trackMapLayer = useTrackMapLayer(mapRef, mapReady, {
        iconSize: 40,
        showLabels: true,
        styleKey: mapStyle,
        onTrackClick: handleMapTrackClick,
    })

    useRegisteredMap(mapRef, mapReady, registerMap)

    const interactionsEnabled = useMapViewInteractions(
        mapRef,
        mapReady,
        mapInteractionsEnabled,
        mapStyle,
    )

    const {
        currentContextMenuElement,
        openBearingRangeContextMenu,
        closeContextMenu,
    } = useMapContextMenuState(contextMenuRef)

    const {
        removeBearingRangeLine,
        clearBearingRangeLines,
        isDrawingBearingRangeLine,
        lines,
    } = useBearingRangeTool(mapRef, mapReady, {
        onContextMenu: openBearingRangeContextMenu,
        lineColor: theme.palette.mode === 'dark' ? '#fff' : '#111',
    })

    const handleRemoveBearingRangeLine = useCallback((lineId) => {
        removeBearingRangeLine(lineId)
        closeContextMenu()
    }, [removeBearingRangeLine, closeContextMenu])

    const handleClearBearingRangeLines = useCallback(() => {
        clearBearingRangeLines()
        closeContextMenu()
    }, [clearBearingRangeLines, closeContextMenu])

    const handleTrackCreated = useCallback((trackManagementWindow) => {
        trackMapLayer.upsertTrack(createTrackFromManagementWindow(trackManagementWindow))
    }, [trackMapLayer])

    const handleTrackUpdated = useCallback((trackManagementWindow) => {
        trackMapLayer.upsertTrack(createTrackFromManagementWindow(trackManagementWindow))
    }, [trackMapLayer])

    const {
        trackManagementWindows,
        initiateTrack,
        openTrackManagementWindow,
        updateTrackManagementWindow,
        closeTrackManagementWindow,
    } = useTrackManagementWindows({
        onInitiateTrack: closeContextMenu,
        onTrackCreated: handleTrackCreated,
        onTrackUpdated: handleTrackUpdated,
    })

    openTrackManagementWindowRef.current = openTrackManagementWindow

    const cursorInfo = useCursorHooks(mapRef, interactionsEnabled, mapContainerRef)
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
                onInitiateTrack={initiateTrack}
                onRemoveBearingRangeLine={handleRemoveBearingRangeLine}
                onClearBearingRangeLines={handleClearBearingRangeLines}
                lines={lines}
            />

            {trackManagementWindows.map((trackManagementWindow) => (
                <TrackManagementWindow
                    key={trackManagementWindow.id}
                    trackManagementWindow={trackManagementWindow}
                    mapContainerRef={mapContainerRef}
                    onChange={updateTrackManagementWindow}
                    onClose={closeTrackManagementWindow}
                />
            ))}
        </div>
    )
}