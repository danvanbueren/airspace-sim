'use client'

import {useCallback, useState} from 'react'

export function useTrackManagementWindows({onInitiateTrack}) {
    const [trackManagementWindows, setTrackManagementWindows] = useState([])

    const initiateTrack = useCallback((elementContainer) => {
        const windowId = crypto.randomUUID()

        setTrackManagementWindows((currentWindows) => [
            ...currentWindows,
            {
                id: windowId,
                trackId: windowId.slice(0, 8).toUpperCase(),
                x: elementContainer.x,
                y: elementContainer.y,
                lngLat: elementContainer.lngLat,
                line: elementContainer.line,
            },
        ])

        onInitiateTrack?.()
    }, [onInitiateTrack])

    const closeTrackManagementWindow = useCallback((windowId) => {
        setTrackManagementWindows((currentWindows) => (
            currentWindows.filter((trackManagementWindow) => trackManagementWindow.id !== windowId)
        ))
    }, [])

    return {
        trackManagementWindows,
        initiateTrack,
        closeTrackManagementWindow,
    }
}