'use client'

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {useTheme} from '@mui/material/styles'
import {useColorMode} from '../../contexts/CustomThemeContext'
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
import {useSensorDetectionMapLayer} from '../../hooks/map/useSensorDetectionMapLayer'
import {useSimulationLoop} from '../../hooks/simulation/useSimulationLoop'
import {useIffEmergencyAlarms} from '../../hooks/simulation/useIffEmergencyAlarms'
import {useTrackManagementKeyboardCustody} from '../../hooks/map/useTrackManagementKeyboardCustody'
import {useMapCursorState} from '../../hooks/map/useMapCursorState'
import {useSimulation} from '../../contexts/SimulationContext'
import {useAppSettings} from '../../contexts/AppSettingsContext'
import {useSensorDisplay} from '../../contexts/SensorDisplayContext'
import {useAirportMapLayer} from '../../hooks/map/useAirportMapLayer'
import {useAirRouteMapLayer} from '../../hooks/map/useAirRouteMapLayer'
import {
    filterTracksByBounds,
    getExpandedMapBounds,
} from '../../simulation/mapViewportUtils'
import {SENSOR_DISPLAY_TOGGLES} from '../../simulation/constants'
import {
    createTrackFromManagementWindow,
    createTrackUpdateFromManagementWindow,
    isReferencePointManagementWindow,
    getTrackIdsRemovedFromLiveSet,
    mergeLiveTracksForManagementWindowSync,
    TRACK_MANAGEMENT_WINDOW_LIVE_SYNC_INTERVAL_MS,
} from '../../tools/map/trackManagementTrack'
import {
    createReferencePointUpdateFromManagementWindow,
    createTrackFromReferencePointManagementWindow,
} from '../../simulation/trackFromReferencePoint'
import MapContextMenu from './MapContextMenu'
import TrackManagementWindow from '../floating/windows/TrackManagementWindow'
import CursorCoordinateOverlay from './CursorCoordinateOverlay'
import TrackAttentionOverlay from './TrackAttentionOverlay'
import 'maplibre-gl/dist/maplibre-gl.css'
import './mapAttributionTheme.css'
import {useAlarmAlertActions} from '../../hooks/global/useAlarmAlertActions'
import {usePerformanceInstrumentation} from '@/app/contexts/PerformanceMonitorContext'

const MAP_STYLES = {
    light: 'map-styles/voyager-gl-style.json',
    dark: 'map-styles/dark-matter-gl-style.json',
}

const EMPTY_TRACKS = []

export default function MapView({
    mapInteractionsEnabled = true,
    mapOverlayLayer = null,
    mapContainerRef: mapContainerRefProp = null,
}) {
    const theme = useTheme()
    const {mode: colorMode} = useColorMode()
    const {raiseAlarmAlert, registerMap} = useAlarmAlertActions()
    const {upsertManualTrack, dropTrack, recoverTrack, setDropProtect, getTrack, getSimulationTimestamp} = useSimulation()
    const {appSettings, simulationSettings} = useAppSettings()
    const performanceInstrumentation = usePerformanceInstrumentation()
    const {isToggleActive} = useSensorDisplay()
    const mapContainerRefInternal = useRef(null)
    const mapContainerRef = mapContainerRefProp ?? mapContainerRefInternal
    const cursorBoxRef = useRef(null)
    const contextMenuRef = useRef(null)
    const openTrackManagementWindowRef = useRef(null)
    const closeMapDismissibleTrackManagementWindowsRef = useRef(null)
    const skipLiveFieldsByWindowIdRef = useRef({})
    const liveTracksRef = useRef([])
    const trackManagementWindowsRef = useRef([])
    const trackMapLayerGetTrackRef = useRef(null)
    const syncTrackManagementWindowsFromLiveTracksRef = useRef(null)
    const previousLiveTrackIdsRef = useRef(new Set())
    const mapStyle = MAP_STYLES[colorMode]

    const {mapRef, mapReady, mapCreationStyle} = useMapLibreMap({
        mapContainerRef,
        initialStyle: mapStyle,
        colorMode,
        onError: (message) => {
            raiseAlarmAlert({
                signalId: 'MAP_ERROR',
                message,
            })
        },
    })
    const mapCursor = useMapCursorState(mapRef, mapReady && mapInteractionsEnabled)

    const handleMapTrackClick = useCallback((track, event) => {
        openTrackManagementWindowRef.current?.(track, event)
    }, [])

    const trackMapLayer = useTrackMapLayer(mapRef, mapReady, {
        iconSize: 40,
        showLabels: true,
        styleKey: mapStyle,
        onTrackClick: handleMapTrackClick,
        mapCursor,
    })

    useRegisteredMap(mapRef, mapReady, registerMap)

    const simulationSnapshot = useSimulationLoop(mapRef, mapReady)
    const [mapVisibleTracks, setMapVisibleTracks] = useState([])
    const simulationTracks = simulationSnapshot?.tracks ?? EMPTY_TRACKS
    const simulationEvaluationTime = simulationSnapshot?.evaluationTime ?? 0
    const iffRefreshMs = simulationSettings.iffRefreshMs ?? 1000

    useIffEmergencyAlarms(
        simulationTracks,
        simulationEvaluationTime,
        iffRefreshMs,
    )

    useSensorDetectionMapLayer(mapRef, mapReady, simulationSnapshot, mapStyle)

    useAirportMapLayer(mapRef, mapReady, {
        airports: simulationSnapshot?.airports,
        visible: isToggleActive(SENSOR_DISPLAY_TOGGLES.AIRPORTS),
        styleKey: mapStyle,
    })

    useAirRouteMapLayer(mapRef, mapReady, {
        routes: simulationSnapshot?.airRoutes,
        airports: simulationSnapshot?.airports,
        visible: isToggleActive(SENSOR_DISPLAY_TOGGLES.AIR_ROUTES),
        styleKey: mapStyle,
    })

    const {
        currentContextMenuElement,
        openBearingRangeContextMenu,
        closeContextMenu,
    } = useMapContextMenuState(contextMenuRef)

    const handleMapContextMenu = useCallback(({point, mapPoint, lngLat, line}) => {
        const layerTrack = mapPoint ? trackMapLayer.getTrackAtMapPoint(mapPoint) : null
        const trackId = layerTrack?.trackId ?? layerTrack?.id
        const track = trackId ? (getTrack(trackId) ?? layerTrack) : null

        openBearingRangeContextMenu({point, lngLat, line, track})
    }, [getTrack, openBearingRangeContextMenu, trackMapLayer])

    const {
        removeBearingRangeLine,
        clearBearingRangeLines,
        isDrawingBearingRangeLine,
        lines,
    } = useBearingRangeTool(mapRef, mapReady, {
        onContextMenu: handleMapContextMenu,
        lineColor: theme.palette.mode === 'dark' ? '#fff' : '#111',
        mapCursor,
        bearingRangeBehavior: appSettings.bearingRangeBehavior,
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
        const track = isReferencePointManagementWindow(trackManagementWindow)
            ? createTrackFromReferencePointManagementWindow(
                trackManagementWindow,
                getSimulationTimestamp(),
            )
            : createTrackFromManagementWindow(trackManagementWindow)

        trackMapLayer.upsertTrack(track)
        upsertManualTrack(track)
    }, [getSimulationTimestamp, trackMapLayer, upsertManualTrack])

    const handleTrackUpdated = useCallback((trackManagementWindow, changedFields) => {
        const trackId = trackManagementWindow.trackId
        const existingTrack = getTrack(trackId) ?? trackMapLayer.getTrack(trackId)

        const track = isReferencePointManagementWindow(trackManagementWindow)
            ? createReferencePointUpdateFromManagementWindow(
                trackManagementWindow,
                existingTrack,
                changedFields,
                getSimulationTimestamp(),
            )
            : createTrackUpdateFromManagementWindow(
                trackManagementWindow,
                existingTrack,
                changedFields,
                getSimulationTimestamp(),
            )

        upsertManualTrack(track)
        trackMapLayer.upsertTrack(track)
    }, [getSimulationTimestamp, getTrack, trackMapLayer, upsertManualTrack])

    const {
        trackManagementWindows,
        initiateTrack,
        initiateReferencePoint,
        openTrackManagementWindow,
        updateTrackManagementWindow,
        setTrackManagementWindowPositionAnchor,
        markTrackManagementWindowPersistent,
        closeMapDismissibleTrackManagementWindows,
        closeTrackManagementWindow,
        closeTrackManagementWindowsForTrack,
        syncTrackManagementWindowsFromLiveTracks,
    } = useTrackManagementWindows({
        onInitiateTrack: closeContextMenu,
        onTrackCreated: handleTrackCreated,
        onTrackUpdated: handleTrackUpdated,
    })

    const handleCreateReferencePoint = useCallback((elementContainer) => {
        initiateReferencePoint(elementContainer, simulationTracks)
    }, [initiateReferencePoint, simulationTracks])

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
        mapCreationStyle,
        mapCursor,
        keyboardCameraControlsEnabled,
    )

    const dismissManagementWindowsForDroppedTrack = useCallback((trackId) => {
        blurTrackWindowsForTrack(trackId)
        clearKeyboardCustodyForTrack(trackId)
        closeTrackManagementWindowsForTrack(trackId)
    }, [
        blurTrackWindowsForTrack,
        clearKeyboardCustodyForTrack,
        closeTrackManagementWindowsForTrack,
    ])

    const handleDropTrack = useCallback((track) => {
        const trackId = track.trackId ?? track.id

        if (!trackId) {
            return
        }

        trackMapLayer.removeTrack(trackId)
        dropTrack(trackId)
        dismissManagementWindowsForDroppedTrack(trackId)
        closeContextMenu()
    }, [
        trackMapLayer,
        dropTrack,
        dismissManagementWindowsForDroppedTrack,
        closeContextMenu,
    ])

    const handleRecoverTrack = useCallback((track) => {
        const trackId = track.trackId ?? track.id

        if (!trackId) {
            return
        }

        recoverTrack(trackId)
        closeContextMenu()
    }, [recoverTrack, closeContextMenu])

    const handleToggleDropProtect = useCallback((track) => {
        const trackId = track.trackId ?? track.id

        if (!trackId) {
            return
        }

        setDropProtect(trackId, !track.dropProtect)
        closeContextMenu()
    }, [setDropProtect, closeContextMenu])

    useEffect(() => {
        const map = mapRef.current

        if (!mapReady || !map || !simulationSnapshot?.tracks) {
            return
        }

        const padding = simulationSettings.viewportPaddingDegrees ?? 0.5

        const syncVisibleTracks = () => {
            const syncStart = performance.now()
            const bounds = getExpandedMapBounds(map, padding)
            const visibleTracks = filterTracksByBounds(simulationSnapshot.tracks, bounds)

            setMapVisibleTracks(visibleTracks)
            trackMapLayer.replaceTracks(visibleTracks)
            performanceInstrumentation.recordViewportSync(
                visibleTracks.length,
                simulationSnapshot.tracks.length,
                performance.now() - syncStart,
            )
        }

        syncVisibleTracks()
        map.on('move', syncVisibleTracks)
        map.on('zoom', syncVisibleTracks)

        return () => {
            map.off('move', syncVisibleTracks)
            map.off('zoom', syncVisibleTracks)
        }
    }, [
        mapReady,
        mapRef,
        mapStyle,
        simulationSnapshot,
        simulationSettings.viewportPaddingDegrees,
        trackMapLayer,
        performanceInstrumentation,
    ])

    useEffect(() => {
        if (!simulationSnapshot) {
            return
        }

        const map = mapRef.current

        performanceInstrumentation.updateFromSnapshot(simulationSnapshot, {
            maxActiveFlights: simulationSettings.maxActiveFlights,
            mapZoom: map?.getZoom?.(),
        })
    }, [
        mapRef,
        performanceInstrumentation,
        simulationSettings.maxActiveFlights,
        simulationSnapshot,
    ])

    const syncOpenManagementWindows = useCallback(() => {
        const evaluationTime = getSimulationTimestamp()
        const tracks = mergeLiveTracksForManagementWindowSync(
            liveTracksRef.current,
            trackManagementWindowsRef.current,
            trackMapLayerGetTrackRef.current,
            evaluationTime,
        )

        if (!tracks.length) {
            return
        }

        syncTrackManagementWindowsFromLiveTracksRef.current?.(
            tracks,
            skipLiveFieldsByWindowIdRef.current,
            evaluationTime,
        )
    }, [getSimulationTimestamp])

    const handleSkipLiveFieldsChange = useCallback((windowId, skipFields) => {
        skipLiveFieldsByWindowIdRef.current = {
            ...skipLiveFieldsByWindowIdRef.current,
            [windowId]: skipFields,
        }
        syncOpenManagementWindows()
    }, [syncOpenManagementWindows])

    liveTracksRef.current = simulationSnapshot?.tracks ?? []
    trackManagementWindowsRef.current = trackManagementWindows
    trackMapLayerGetTrackRef.current = trackMapLayer.getTrack

    useEffect(() => {
        syncTrackManagementWindowsFromLiveTracksRef.current = syncTrackManagementWindowsFromLiveTracks
    }, [syncTrackManagementWindowsFromLiveTracks])

    useEffect(() => {
        const {currentLiveTrackIds, removedTrackIds} = getTrackIdsRemovedFromLiveSet(
            previousLiveTrackIdsRef.current,
            simulationSnapshot?.tracks ?? EMPTY_TRACKS,
        )

        previousLiveTrackIdsRef.current = currentLiveTrackIds

        if (removedTrackIds.length === 0 || trackManagementWindows.length === 0) {
            return
        }

        const openTrackIds = new Set(trackManagementWindows.map((window) => window.trackId))

        for (const trackId of removedTrackIds) {
            if (openTrackIds.has(trackId)) {
                dismissManagementWindowsForDroppedTrack(trackId)
            }
        }
    }, [
        dismissManagementWindowsForDroppedTrack,
        simulationSnapshot?.tracks,
        trackManagementWindows,
    ])

    useEffect(() => {
        if (trackManagementWindows.length === 0) {
            return
        }

        syncOpenManagementWindows()

        const intervalId = window.setInterval(
            syncOpenManagementWindows,
            TRACK_MANAGEMENT_WINDOW_LIVE_SYNC_INTERVAL_MS,
        )

        return () => {
            window.clearInterval(intervalId)
        }
    }, [syncOpenManagementWindows, trackManagementWindows.length])

    const tracksForCallsignValidation = useMemo(() => {
        const tracksById = new Map()

        for (const track of simulationSnapshot?.tracks ?? []) {
            const trackId = track.trackId ?? track.id

            if (trackId) {
                tracksById.set(trackId, track)
            }
        }

        for (const trackManagementWindow of trackManagementWindows) {
            tracksById.set(trackManagementWindow.trackId, {
                trackId: trackManagementWindow.trackId,
                callsign: trackManagementWindow.callsign,
            })
        }

        return Array.from(tracksById.values())
    }, [simulationSnapshot?.tracks, trackManagementWindows])

    const handleCloseTrackManagementWindow = useCallback((windowId) => {
        closeTrackManagementWindowWithBlur(windowId, closeTrackManagementWindow)
    }, [closeTrackManagementWindow, closeTrackManagementWindowWithBlur])

    const handleOpenTrackManagementWindow = useCallback((track, event) => {
        openTrackManagementWindow(track, event)
        closeContextMenu()

        const trackId = track.trackId ?? track.id

        if (trackId) {
            bringTrackManagementWindowToFront(`track-${trackId}`)
            const existingWindow = trackManagementWindows.find((trackManagementWindow) => (
                trackManagementWindow.trackId === trackId
            ))

            bringTrackManagementWindowToFront(existingWindow?.id ?? `track-${trackId}`)
        }
    }, [
        openTrackManagementWindow,
        closeContextMenu,
        trackManagementWindows,
        bringTrackManagementWindowToFront,
    ])

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
                    tracksForCallsignValidation={tracksForCallsignValidation}
                    onChange={updateTrackManagementWindow}
                    onMoveComplete={setTrackManagementWindowPositionAnchor}
                    onActivate={markTrackManagementWindowPersistent}
                    onClaimKeyboardCustody={claimTrackManagementKeyboardCustody}
                    onClose={handleCloseTrackManagementWindow}
                    onSkipLiveFieldsChange={handleSkipLiveFieldsChange}
                    hasKeyboardCustody={trackManagementKeyboardCustodyWindowId === trackManagementWindow.id}
                    zIndex={getWindowZIndex(trackManagementWindow.id)}
                    evaluationTime={simulationEvaluationTime}
                />
            ))}

            <MapContextMenu
                ref={contextMenuRef}
                elementContainer={currentContextMenuElement}
                contextMenuSize={contextMenuSize}
                mapContainerRef={mapContainerRef}
                onInitiateTrack={initiateTrack}
                onCreateReferencePoint={handleCreateReferencePoint}
                onDropTrack={handleDropTrack}
                onRecoverTrack={handleRecoverTrack}
                onToggleDropProtect={handleToggleDropProtect}
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
            <TrackAttentionOverlay
                mapRef={mapRef}
                mapReady={mapReady}
                tracks={mapVisibleTracks}
                evaluationTime={simulationEvaluationTime}
                iffRefreshMs={iffRefreshMs}
            />

            {mapOverlayLayer
                ? createPortal(mapOverlays, mapOverlayLayer)
                : mapOverlays}
        </div>
    )
}