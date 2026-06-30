'use client'

import {useCallback, useEffect, useMemo, useRef} from 'react'

export const MAP_CURSOR_REQUESTS = {
    DEFAULT: 'default',
    MAP_ACTIVE: 'map-active',
    DRAG_PAN: 'drag-pan',
    TRACK_HOVER: 'track-hover',
    BEARING_RANGE_HOVER: 'bearing-range-hover',
    BEARING_RANGE_DRAW: 'bearing-range-draw',
    DRAW_GEOMETRY: 'draw-geometry',
    GEOMETRY_HOVER: 'geometry-hover',
}

export const MAP_CURSOR_PRIORITIES = {
    DEFAULT: 0,
    HOVER: 10,
    CONTEXT: 20,
    ACTIVE: 100,
}

function getWinningCursorRequest(requests) {
    let winningRequest = null

    requests.forEach((request) => {
        if (
            !winningRequest
            || request.priority > winningRequest.priority
            || (
                request.priority === winningRequest.priority
                && request.sequence > winningRequest.sequence
            )
        ) {
            winningRequest = request
        }
    })

    return winningRequest
}

export function useMapCursorState(mapRef, enabled) {
    const enabledRef = useRef(enabled)
    const requestSequenceRef = useRef(0)
    const cursorRequestsRef = useRef(new Map())

    enabledRef.current = enabled

    const applyCursor = useCallback(() => {
        const canvas = mapRef.current?.getCanvas()

        if (!canvas) {
            return
        }

        if (!enabledRef.current) {
            canvas.style.cursor = ''
            return
        }

        const winningRequest = getWinningCursorRequest(cursorRequestsRef.current)

        canvas.style.cursor = winningRequest?.cursor ?? ''
    }, [mapRef])

    const requestCursor = useCallback((source, cursor, priority = MAP_CURSOR_PRIORITIES.DEFAULT) => {
        if (!source) {
            return
        }

        if (!cursor) {
            cursorRequestsRef.current.delete(source)
            applyCursor()
            return
        }

        requestSequenceRef.current += 1
        cursorRequestsRef.current.set(source, {
            cursor,
            priority,
            sequence: requestSequenceRef.current,
        })
        applyCursor()
    }, [applyCursor])

    const clearCursorRequest = useCallback((source) => {
        if (!cursorRequestsRef.current.delete(source)) {
            return
        }

        applyCursor()
    }, [applyCursor])

    const clearCursorRequests = useCallback((sources) => {
        let didClearRequest = false

        sources.forEach((source) => {
            didClearRequest = cursorRequestsRef.current.delete(source) || didClearRequest
        })

        if (didClearRequest) {
            applyCursor()
        }
    }, [applyCursor])

    useEffect(() => {
        applyCursor()
    }, [applyCursor, enabled])

    useEffect(() => {
        return () => {
            cursorRequestsRef.current.clear()

            const canvas = mapRef.current?.getCanvas()

            if (canvas) {
                canvas.style.cursor = ''
            }
        }
    }, [mapRef])

    return useMemo(() => ({
        requestCursor,
        clearCursorRequest,
        clearCursorRequests,
    }), [
        requestCursor,
        clearCursorRequest,
        clearCursorRequests,
    ])
}
