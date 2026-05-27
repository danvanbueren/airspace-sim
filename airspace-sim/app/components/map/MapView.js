'use client'

import {useCallback, useEffect, useRef} from 'react'
import {createPortal} from 'react-dom'
import {useTheme} from '@mui/material/styles'
import {useCursorHooks} from '../../hooks/map/useCursorHooks'
import {useMapLibreMap} from '../../hooks/map/useMapLibreMap'
import {useMeasuredElementSize} from '../../hooks/global/useMeasuredElementSize'
import {useBearingRangeTool} from '../../hooks/map/useBearingRangeTool'
import {useRegisteredMap} from '../../hooks/map/useRegisteredMap'
import {useMapViewInteractions} from '../../hooks/map/useMapViewInteractions/useMapViewInteractions'
import {useMapContextMenuState} from '../../hooks/map/useMapContextMenuState'
import {useTrackManagementWindows} from '../../hooks/map/useTrackManagementWindows'
import {useTrackManagementWindowFocusOrder} from '../../hooks/map/useTrackManagementWindowFocusOrder'
import {useTrackMapLayer} from '../../hooks/map/useTrackMapLayer'
import {useTrackManagementKeyboardCustody} from '../../hooks/map/useTrackManagementKeyboardCustody'
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
        infoFields: Boolean(trackManagementWindow.infoFields),
        callsign: trackManagementWindow.callsign || trackManagementWindow.trackId,
    }
}

export default function MapView({mapInteractionsEnabled = true, mapOverlayLayer = null}) {
    const theme = useTheme()
    const {addAlarmAlert, registerMap} = useMapState()
    const mapContainerRef = useRef(null)
    const cursorBoxRef = useRef(null)
    const contextMenuRef = useRef(null)
    const openTrackManagementWindowRef = useRef(null)
    const closeMapDismissibleTrackManagementWindowsRef = useRef(null)
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

    const {
        currentContextMenuElement,
        openBearingRangeContextMenu,
        closeContextMenu,
    } = useMapContextMenuState(contextMenuRef)

    const handleMapContextMenu = useCallback(({point, mapPoint, lngLat, line}) => {
        const track = mapPoint ? trackMapLayer.getTrackAtMapPoint(mapPoint) : null

        openBearingRangeContextMenu({point, lngLat, line, track})
    }, [openBearingRangeContextMenu, trackMapLayer])

    const {
        removeBearingRangeLine,
        clearBearingRangeLines,
        isDrawingBearingRangeLine,
        lines,
    } = useBearingRangeTool(mapRef, mapReady, {
        onContextMenu: handleMapContextMenu,
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
        moveTrackManagementWindow,
        markTrackManagementWindowPersistent,
        closeMapDismissibleTrackManagementWindows,
        closeTrackManagementWindow,
        closeTrackManagementWindowsForTrack,
    } = useTrackManagementWindows({
        onInitiateTrack: closeContextMenu,
        onTrackCreated: handleTrackCreated,
        onTrackUpdated: handleTrackUpdated,
    })

    const {
        sortedTrackManagementWindows,
        bringTrackManagementWindowToFront,
        getWindowZIndex,
    } = useTrackManagementWindowFocusOrder(trackManagementWindows)

    const {
        trackManagementKeyboardCustodyWindowId,
        registerTrackManagementWindowElement,
        releaseTrackManagementKeyboardCustody,
        claimTrackManagementKeyboardCustody,
        closeTrackManagementWindowWithBlur,
        clearKeyboardCustodyForTrack,
        blurTrackWindowsForTrack,
    } = useTrackManagementKeyboardCustody({
        trackManagementWindows,
        bringTrackManagementWindowToFront,
    })

    const keyboardCameraControlsEnabled = trackManagementKeyboardCustodyWindowId === null

    const interactionsEnabled = useMapViewInteractions(
        mapRef,
        mapReady,
        mapInteractionsEnabled,
        mapStyle,
        keyboardCameraControlsEnabled,
    )

    const handleDropTrack = useCallback((track) => {
        const trackId = track.trackId ?? track.id

        if (!trackId) {
            return
        }

        blurTrackWindowsForTrack(trackId)
        clearKeyboardCustodyForTrack(trackId)

        trackMapLayer.removeTrack(trackId)
        closeTrackManagementWindowsForTrack(trackId)
        closeContextMenu()
    }, [
        blurTrackWindowsForTrack,
        clearKeyboardCustodyForTrack,
        trackMapLayer,
        closeTrackManagementWindowsForTrack,
        closeContextMenu,
    ])

    const handleCloseTrackManagementWindow = useCallback((windowId) => {
        closeTrackManagementWindowWithBlur(windowId, closeTrackManagementWindow)
    }, [closeTrackManagementWindow, closeTrackManagementWindowWithBlur])

    const handleOpenTrackManagementWindow = useCallback((track, event) => {
        openTrackManagementWindow(track, event)

        const trackId = track.trackId ?? track.id

        if (trackId) {
            bringTrackManagementWindowToFront(`track-${trackId}`)
        }
    }, [openTrackManagementWindow, bringTrackManagementWindowToFront])

    openTrackManagementWindowRef.current = handleOpenTrackManagementWindow
    closeMapDismissibleTrackManagementWindowsRef.current = closeMapDismissibleTrackManagementWindows

    useEffect(() => {
        if (!mapReady || !mapRef.current) {
            return
        }

        const map = mapRef.current

        const handleMapClick = (event) => {
            if (event.defaultPrevented) {
                return
            }

            releaseTrackManagementKeyboardCustody()

            const trackLayers = [
                trackMapLayer.layerId,
                trackMapLayer.labelLayerId,
            ].filter((layerId) => map.getLayer(layerId))

            const clickedTrack = trackLayers.length > 0 && map.queryRenderedFeatures(
                event.point,
                {layers: trackLayers},
            ).length > 0

            if (clickedTrack) {
                return
            }

            closeMapDismissibleTrackManagementWindowsRef.current?.()
        }

        map.on('click', handleMapClick)

        return () => {
            map.off('click', handleMapClick)
        }
    }, [mapReady, mapRef, trackMapLayer.layerId, trackMapLayer.labelLayerId, releaseTrackManagementKeyboardCustody])

    const cursorInfo = useCursorHooks(mapRef, interactionsEnabled, mapContainerRef)
    const visibleCursorInfo = isDrawingBearingRangeLine ? null : cursorInfo
    const cursorBoxSize = useMeasuredElementSize(cursorBoxRef, [visibleCursorInfo])
    const contextMenuSize = useMeasuredElementSize(contextMenuRef, [currentContextMenuElement])

    const mapOverlays = (
        <>
            {sortedTrackManagementWindows.map((trackManagementWindow) => (
                <TrackManagementWindow
                    key={trackManagementWindow.id}
                    ref={(element) => registerTrackManagementWindowElement(trackManagementWindow.id, element)}
                    trackManagementWindow={trackManagementWindow}
                    mapContainerRef={mapContainerRef}
                    onChange={updateTrackManagementWindow}
                    onMove={moveTrackManagementWindow}
                    onActivate={markTrackManagementWindowPersistent}
                    onClaimKeyboardCustody={claimTrackManagementKeyboardCustody}
                    onClose={handleCloseTrackManagementWindow}
                    hasKeyboardCustody={trackManagementKeyboardCustodyWindowId === trackManagementWindow.id}
                    zIndex={getWindowZIndex(trackManagementWindow.id)}
                />
            ))}

            <MapContextMenu
                ref={contextMenuRef}
                elementContainer={currentContextMenuElement}
                contextMenuSize={contextMenuSize}
                mapContainerRef={mapContainerRef}
                onInitiateTrack={initiateTrack}
                onDropTrack={handleDropTrack}
                onRemoveBearingRangeLine={handleRemoveBearingRangeLine}
                onClearBearingRangeLines={handleClearBearingRangeLines}
                lines={lines}
            />
        </>
    )

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

            {mapOverlayLayer
                ? createPortal(mapOverlays, mapOverlayLayer)
                : mapOverlays}
        </div>
    )
}