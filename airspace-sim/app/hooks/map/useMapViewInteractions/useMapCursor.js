'use client'

import {useEffect} from 'react'
import {
    getMouseEventButtons,
    pressedMouseButtonsMatchBinding,
    useControlBindings,
} from '@/app/contexts/ControlBindingsContext'
import {
    MAP_CURSOR_PRIORITIES,
    MAP_CURSOR_REQUESTS,
} from '../useMapCursorState'

export function useMapCursor(mapRef, enabled, mapCursor) {
    const {controlBindings} = useControlBindings()
    const mapCursorBindings = controlBindings.mapCursor

    useEffect(() => {
        if (!mapRef.current || !mapCursor)
            return

        const map = mapRef.current
        let isDragButtonDown = false
        let isShiftDown = false
        let isPointerOverMap = false

        if (!enabled) {
            mapCursor.clearCursorRequests([
                MAP_CURSOR_REQUESTS.DEFAULT,
                MAP_CURSOR_REQUESTS.MAP_ACTIVE,
            ])
            return
        }

        const setDefaultCursorRequest = (cursor) => {
            mapCursor.requestCursor(
                MAP_CURSOR_REQUESTS.DEFAULT,
                cursor,
                MAP_CURSOR_PRIORITIES.DEFAULT,
            )
        }

        const setActiveCursorRequest = (cursor) => {
            mapCursor.requestCursor(
                MAP_CURSOR_REQUESTS.MAP_ACTIVE,
                cursor,
                MAP_CURSOR_PRIORITIES.ACTIVE,
            )
        }

        const setDefaultCursor = () => {
            isDragButtonDown = false
            mapCursor.clearCursorRequest(MAP_CURSOR_REQUESTS.MAP_ACTIVE)
            setDefaultCursorRequest(isShiftDown && isPointerOverMap ? 'nesw-resize' : 'crosshair')
        }

        const setActiveCursor = () => {
            if (isShiftDown && isPointerOverMap) {
                setActiveCursorRequest('nesw-resize')
                return
            }

            if (isDragButtonDown) {
                setActiveCursorRequest('grabbing')
                return
            }

            mapCursor.clearCursorRequest(MAP_CURSOR_REQUESTS.MAP_ACTIVE)
            setDefaultCursorRequest('crosshair')
        }

        const setCustomCursor = (event) => {
            const buttons = getMouseEventButtons(event)

            if (pressedMouseButtonsMatchBinding(buttons, mapCursorBindings.dragButton)) {
                isDragButtonDown = true
                setActiveCursor()
                return
            }

            if (pressedMouseButtonsMatchBinding(buttons, mapCursorBindings.pointerButton))
                setActiveCursorRequest('pointer')
        }

        const keepDragCursor = () => {
            setActiveCursor()
        }

        const handleMouseEnter = () => {
            isPointerOverMap = true
            setActiveCursor()
        }
        const handleMouseLeave = () => {
            isPointerOverMap = false
            setActiveCursor()
        }

        const handleKeyDown = (event) => {
            if (event.key !== 'Shift')
                return

            isShiftDown = true
            setActiveCursor()
        }

        const handleKeyUp = (event) => {
            if (event.key !== 'Shift')
                return

            isShiftDown = false
            setActiveCursor()
        }

        setDefaultCursor()

        map.on('mousedown', setCustomCursor)
        map.on('dragstart', keepDragCursor)
        map.on('drag', keepDragCursor)
        map.on('mouseup', setDefaultCursor)
        map.on('dragend', setDefaultCursor)
        map.getCanvas().addEventListener('mouseenter', handleMouseEnter)
        map.getCanvas().addEventListener('mouseleave', handleMouseLeave)
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        window.addEventListener('mouseup', setDefaultCursor)

        return () => {
            map.off('mousedown', setCustomCursor)
            map.off('dragstart', keepDragCursor)
            map.off('drag', keepDragCursor)
            map.off('mouseup', setDefaultCursor)
            map.off('dragend', setDefaultCursor)
            map.getCanvas().removeEventListener('mouseenter', handleMouseEnter)
            map.getCanvas().removeEventListener('mouseleave', handleMouseLeave)
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
            window.removeEventListener('mouseup', setDefaultCursor)
            mapCursor.clearCursorRequests([
                MAP_CURSOR_REQUESTS.DEFAULT,
                MAP_CURSOR_REQUESTS.MAP_ACTIVE,
            ])
        }
    }, [mapRef, enabled, mapCursor, mapCursorBindings])
}