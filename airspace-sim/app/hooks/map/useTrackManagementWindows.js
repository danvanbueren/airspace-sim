'use client'

import {useCallback, useState} from 'react'
import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    getDefaultTrackTypeForDomain,
} from '../../tools/milstd2525/trackSymbolCodes'

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
            type: getDefaultTrackTypeForDomain(TRACK_DOMAINS.AIR),
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
                }

                onTrackUpdated?.(updatedTrackManagementWindow)

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
                        dismissOnMapClick: false,
                    }
                })
            }

            const domain = track.domain ?? TRACK_DOMAINS.AIR

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
                    type: track.type ?? getDefaultTrackTypeForDomain(domain),
                    callsign: track.callsign ?? track.trackId ?? track.id,
                    heading: track.heading ?? 0,
                    speed: track.speed ?? '',
                    altitude: track.altitude ?? '',
                    infoFields: Boolean(track.infoFields),
                    correlationMode: track.correlationMode ?? 'active',
                    source: track.source ?? 'auto',
                    dismissOnMapClick: false,
                },
            ]
        })
    }, [])

    const moveTrackManagementWindow = useCallback((windowId, position) => {
        setTrackManagementWindows((currentWindows) => (
            currentWindows.map((trackManagementWindow) => {
                if (trackManagementWindow.id !== windowId) {
                    return trackManagementWindow
                }

                return {
                    ...trackManagementWindow,
                    ...position,
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

    return {
        trackManagementWindows,
        initiateTrack,
        openTrackManagementWindow,
        updateTrackManagementWindow,
        moveTrackManagementWindow,
        markTrackManagementWindowPersistent,
        closeMapDismissibleTrackManagementWindows,
        closeTrackManagementWindow,
        closeTrackManagementWindowsForTrack,
    }
}