'use client'

import {useCallback, useState} from 'react'
import {
    REFERENCE_POINT_SYMBOL_CODE,
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    getUnspecifiedTrackTypeForDomain,
} from '../../tools/milstd2525/trackSymbolCodes'
import {getDefaultSpecificTypeForTrackType} from '../../tools/milstd2525/trackSpecificTypes'
import {parseTrackKinematicFields} from '../../tools/formatting/trackFieldFormatting'
import {syncTrackManagementWindowsFromTracks} from '../../tools/map/trackManagementTrack'
import {edgeAnchorsEqual} from '../../tools/map/edgeAnchoredPosition'
import {allocateNextReferencePointLabel} from '../../simulation/trackFromReferencePoint'
import {TRACK_KINDS} from '../../simulation/trackKinds'
import {TRACK_CORRELATION_MODES} from '../../simulation/trackFromDetection'

export function useTrackManagementWindows({onInitiateTrack, onTrackCreated, onTrackUpdated}) {
    const [trackManagementWindows, setTrackManagementWindows] = useState([])

    const initiateTrack = useCallback((elementContainer) => {
        const windowId = crypto.randomUUID()
        const trackId = windowId.slice(0, 8).toUpperCase()

        const trackManagementWindow = {
            id: windowId,
            trackId,
            x: elementContainer.x,
            y: elementContainer.y,
            lngLat: elementContainer.lngLat,
            line: elementContainer.line,
            domain: TRACK_DOMAINS.AIR,
            identity: TRACK_IDENTITIES.PENDING,
            type: getUnspecifiedTrackTypeForDomain(TRACK_DOMAINS.AIR),
            specificType: getDefaultSpecificTypeForTrackType(
                getUnspecifiedTrackTypeForDomain(TRACK_DOMAINS.AIR),
            ),
            callsign: trackId,
            heading: 0,
            speed: '',
            altitude: '',
            infoFields: false,
            correlationMode: 'active',
            source: 'manual',
            dismissOnMapClick: true,
        }

        setTrackManagementWindows((currentWindows) => [
            ...currentWindows,
            trackManagementWindow,
        ])

        onTrackCreated?.(trackManagementWindow)
        onInitiateTrack?.()
    }, [onInitiateTrack, onTrackCreated])

    const initiateReferencePoint = useCallback((elementContainer, existingTracks = []) => {
        const windowId = crypto.randomUUID()
        const trackId = `RP-${windowId.slice(0, 8).toUpperCase()}`

        const trackManagementWindow = {
            id: windowId,
            trackId,
            trackKind: TRACK_KINDS.REFERENCE_POINT,
            x: elementContainer.x,
            y: elementContainer.y,
            lngLat: elementContainer.lngLat,
            line: elementContainer.line,
            domain: TRACK_DOMAINS.ACTIVITY,
            identity: TRACK_IDENTITIES.NEUTRAL,
            type: REFERENCE_POINT_SYMBOL_CODE,
            specificType: '',
            callsign: allocateNextReferencePointLabel(existingTracks),
            heading: 0,
            speed: '',
            altitude: '',
            infoFields: false,
            correlationMode: TRACK_CORRELATION_MODES.SUSPEND,
            source: 'manual',
            dismissOnMapClick: true,
        }

        setTrackManagementWindows((currentWindows) => [
            ...currentWindows,
            trackManagementWindow,
        ])

        onTrackCreated?.(trackManagementWindow)
        onInitiateTrack?.()
    }, [onInitiateTrack, onTrackCreated])

    const updateTrackManagementWindow = useCallback((windowId, updates) => {
        setTrackManagementWindows((currentWindows) => (
            currentWindows.map((trackManagementWindow) => {
                if (trackManagementWindow.id !== windowId) {
                    return trackManagementWindow
                }

                const updatedTrackManagementWindow = {
                    ...trackManagementWindow,
                    ...updates,
                    dismissOnMapClick: false,
                    ...(trackManagementWindow.source === 'auto' ? {source: 'manual'} : {}),
                }

                onTrackUpdated?.(updatedTrackManagementWindow, Object.keys(updates))

                return updatedTrackManagementWindow
            })
        ))
    }, [onTrackUpdated])

    const openTrackManagementWindow = useCallback((track, mapClickEvent) => {
        setTrackManagementWindows((currentWindows) => {
            const trackId = track.trackId ?? track.id
            const existingWindow = currentWindows.find((trackManagementWindow) => (
                trackManagementWindow.trackId === trackId
            ))

            const point = mapClickEvent?.point ?? {x: 0, y: 0}
            const lngLat = mapClickEvent?.lngLat ?? {
                lng: track.longitude,
                lat: track.latitude,
            }

            if (existingWindow) {
                return currentWindows.map((trackManagementWindow) => {
                    if (trackManagementWindow.trackId !== trackId) {
                        return trackManagementWindow
                    }

                    return {
                        ...trackManagementWindow,
                        x: point.x,
                        y: point.y,
                        positionAnchor: undefined,
                        dismissOnMapClick: false,
                    }
                })
            }

            const domain = track.domain ?? TRACK_DOMAINS.AIR
            const kinematicFields = parseTrackKinematicFields(track)

            return [
                ...currentWindows,
                {
                    id: `track-${trackId}`,
                    trackId,
                    x: point.x,
                    y: point.y,
                    lngLat,
                    line: null,
                    domain,
                    identity: track.identity ?? TRACK_IDENTITIES.PENDING,
                    type: track.type ?? getUnspecifiedTrackTypeForDomain(domain),
                    specificType: track.specificType ?? getDefaultSpecificTypeForTrackType(
                        track.type ?? getUnspecifiedTrackTypeForDomain(domain),
                    ),
                    callsign: track.callsign ?? track.trackId ?? track.id,
                    heading: kinematicFields.heading,
                    speed: kinematicFields.speed,
                    altitude: kinematicFields.altitude,
                    infoFields: Boolean(track.infoFields),
                    correlationMode: track.correlationMode ?? 'active',
                    source: track.source ?? 'auto',
                    trackKind: track.trackKind ?? TRACK_KINDS.TRACK,
                    dismissOnMapClick: false,
                },
            ]
        })
    }, [])

    const setTrackManagementWindowPositionAnchor = useCallback((windowId, positionAnchor) => {
        setTrackManagementWindows((currentWindows) => (
            currentWindows.map((trackManagementWindow) => {
                if (trackManagementWindow.id !== windowId) {
                    return trackManagementWindow
                }

                if (edgeAnchorsEqual(trackManagementWindow.positionAnchor, positionAnchor)) {
                    return trackManagementWindow
                }

                return {
                    ...trackManagementWindow,
                    positionAnchor,
                }
            })
        ))
    }, [])

    const markTrackManagementWindowPersistent = useCallback((windowId) => {
        setTrackManagementWindows((currentWindows) => (
            currentWindows.map((trackManagementWindow) => {
                if (trackManagementWindow.id !== windowId) {
                    return trackManagementWindow
                }

                return {
                    ...trackManagementWindow,
                    dismissOnMapClick: false,
                }
            })
        ))
    }, [])

    const closeMapDismissibleTrackManagementWindows = useCallback(() => {
        setTrackManagementWindows((currentWindows) => (
            currentWindows.filter((trackManagementWindow) => !trackManagementWindow.dismissOnMapClick)
        ))
    }, [])

    const closeTrackManagementWindow = useCallback((windowId) => {
        setTrackManagementWindows((currentWindows) => (
            currentWindows.filter((trackManagementWindow) => trackManagementWindow.id !== windowId)
        ))
    }, [])

    const closeTrackManagementWindowsForTrack = useCallback((trackId) => {
        setTrackManagementWindows((currentWindows) => (
            currentWindows.filter((trackManagementWindow) => trackManagementWindow.trackId !== trackId)
        ))
    }, [])

    const syncTrackManagementWindowsFromLiveTracks = useCallback((
        tracks,
        skipFieldsByWindowId = {},
        evaluationTime = Date.now(),
    ) => {
        setTrackManagementWindows((currentWindows) => (
            syncTrackManagementWindowsFromTracks(
                currentWindows,
                tracks,
                skipFieldsByWindowId,
                evaluationTime,
            )
        ))
    }, [])

    return {
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
    }
}