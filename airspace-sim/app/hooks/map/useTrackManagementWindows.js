'use client'

import {useCallback, useState} from 'react'
import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    TRACK_TYPES,
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
            identity: TRACK_IDENTITIES.UNKNOWN,
            type: TRACK_TYPES.FIGHTER,
            callsign: trackId,
            heading: 0,
            speed: '',
            altitude: '',
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
                }

                onTrackUpdated?.(updatedTrackManagementWindow)

                return updatedTrackManagementWindow
            })
        ))
    }, [onTrackUpdated])

    const openTrackManagementWindow = useCallback((track, mapClickEvent) => {
        setTrackManagementWindows((currentWindows) => {
            const existingWindow = currentWindows.find((trackManagementWindow) => (
                trackManagementWindow.trackId === track.trackId
            ))

            const point = mapClickEvent?.point ?? {x: 0, y: 0}
            const lngLat = mapClickEvent?.lngLat ?? {
                lng: track.longitude,
                lat: track.latitude,
            }

            if (existingWindow) {
                return currentWindows.map((trackManagementWindow) => {
                    if (trackManagementWindow.trackId !== track.trackId) {
                        return trackManagementWindow
                    }

                    return {
                        ...trackManagementWindow,
                        x: point.x,
                        y: point.y,
                    }
                })
            }

            return [
                ...currentWindows,
                {
                    id: `track-${track.trackId ?? track.id}`,
                    trackId: track.trackId ?? track.id,
                    x: point.x,
                    y: point.y,
                    lngLat,
                    line: null,
                    domain: track.domain,
                    identity: track.identity,
                    type: track.type,
                    callsign: track.callsign ?? track.trackId ?? track.id,
                    heading: track.heading ?? 0,
                    speed: track.speed ?? '',
                    altitude: track.altitude ?? '',
                },
            ]
        })
    }, [])

    const closeTrackManagementWindow = useCallback((windowId) => {
        setTrackManagementWindows((currentWindows) => (
            currentWindows.filter((trackManagementWindow) => trackManagementWindow.id !== windowId)
        ))
    }, [])

    return {
        trackManagementWindows,
        initiateTrack,
        openTrackManagementWindow,
        updateTrackManagementWindow,
        closeTrackManagementWindow,
    }
}