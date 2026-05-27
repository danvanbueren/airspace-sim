'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import {getTrackManagementWindowZIndex} from '@/app/constants/uiZIndex'

export function useTrackManagementWindowFocusOrder(trackManagementWindows) {
    const [focusOrder, setFocusOrder] = useState([])

    useEffect(() => {
        setFocusOrder((currentOrder) => {
            const windowIds = new Set(trackManagementWindows.map((window) => window.id))
            const nextOrder = currentOrder.filter((windowId) => windowIds.has(windowId))
            const knownIds = new Set(nextOrder)

            trackManagementWindows.forEach((window) => {
                if (!knownIds.has(window.id)) {
                    nextOrder.push(window.id)
                }
            })

            return nextOrder
        })
    }, [trackManagementWindows])

    const bringTrackManagementWindowToFront = useCallback((windowId) => {
        if (!windowId) {
            return
        }

        setFocusOrder((currentOrder) => (
            [...currentOrder.filter((id) => id !== windowId), windowId]
        ))
    }, [])

    const sortedTrackManagementWindows = useMemo(() => {
        const orderIndex = new Map(focusOrder.map((windowId, index) => [windowId, index]))

        return [...trackManagementWindows].sort((left, right) => (
            (orderIndex.get(left.id) ?? 0) - (orderIndex.get(right.id) ?? 0)
        ))
    }, [trackManagementWindows, focusOrder])

    const getWindowZIndex = useCallback((windowId) => {
        const stackIndex = focusOrder.indexOf(windowId)

        return getTrackManagementWindowZIndex(stackIndex >= 0 ? stackIndex : 0)
    }, [focusOrder])

    return {
        sortedTrackManagementWindows,
        bringTrackManagementWindowToFront,
        getWindowZIndex,
    }
}
