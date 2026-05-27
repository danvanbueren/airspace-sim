'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {blurFocusedElementWithin} from '@/app/tools/browser/blurFocusedElementWithin'

export function useTrackManagementKeyboardCustody({trackManagementWindows, bringTrackManagementWindowToFront}) {
    const [trackManagementKeyboardCustodyWindowId, setTrackManagementKeyboardCustodyWindowId] = useState(null)
    const trackManagementKeyboardCustodyWindowIdRef = useRef(null)
    const trackManagementWindowRefs = useRef(new Map())

    useEffect(() => {
        trackManagementKeyboardCustodyWindowIdRef.current = trackManagementKeyboardCustodyWindowId
    }, [trackManagementKeyboardCustodyWindowId])

    const registerTrackManagementWindowElement = useCallback((windowId, element) => {
        if (element) {
            trackManagementWindowRefs.current.set(windowId, element)
            return
        }

        trackManagementWindowRefs.current.delete(windowId)
    }, [])

    const releaseTrackManagementKeyboardCustody = useCallback(() => {
        const custodyWindowId = trackManagementKeyboardCustodyWindowIdRef.current

        if (custodyWindowId) {
            blurFocusedElementWithin(trackManagementWindowRefs.current.get(custodyWindowId))
        }

        setTrackManagementKeyboardCustodyWindowId(null)
    }, [])

    const claimTrackManagementKeyboardCustody = useCallback((windowId) => {
        const previousCustodyWindowId = trackManagementKeyboardCustodyWindowIdRef.current

        if (previousCustodyWindowId && previousCustodyWindowId !== windowId) {
            blurFocusedElementWithin(trackManagementWindowRefs.current.get(previousCustodyWindowId))
        }

        bringTrackManagementWindowToFront(windowId)
        setTrackManagementKeyboardCustodyWindowId(windowId)
    }, [bringTrackManagementWindowToFront])

    const closeTrackManagementWindowWithBlur = useCallback((windowId, onClose) => {
        blurFocusedElementWithin(trackManagementWindowRefs.current.get(windowId))
        setTrackManagementKeyboardCustodyWindowId((currentWindowId) => (
            currentWindowId === windowId ? null : currentWindowId
        ))
        onClose(windowId)
    }, [])

    const clearKeyboardCustodyForTrack = useCallback((trackId) => {
        setTrackManagementKeyboardCustodyWindowId((currentWindowId) => {
            if (!currentWindowId) {
                return null
            }

            const custodyWindow = trackManagementWindows.find((window) => window.id === currentWindowId)
            return custodyWindow?.trackId === trackId ? null : currentWindowId
        })
    }, [trackManagementWindows])

    const blurTrackWindowsForTrack = useCallback((trackId) => {
        trackManagementWindows
            .filter((trackManagementWindow) => trackManagementWindow.trackId === trackId)
            .forEach((trackManagementWindow) => {
                blurFocusedElementWithin(trackManagementWindowRefs.current.get(trackManagementWindow.id))
            })
    }, [trackManagementWindows])

    return {
        trackManagementKeyboardCustodyWindowId,
        registerTrackManagementWindowElement,
        releaseTrackManagementKeyboardCustody,
        claimTrackManagementKeyboardCustody,
        closeTrackManagementWindowWithBlur,
        clearKeyboardCustodyForTrack,
        blurTrackWindowsForTrack,
    }
}
