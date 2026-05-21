'use client'

import {useEffect} from 'react'
import {
    getMouseEventButtons,
    pressedMouseButtonsMatchBinding,
    useControlBindings,
} from '@/app/contexts/ControlBindingsContext'

export function useMapCursor(mapRef, enabled) {
    const {controlBindings} = useControlBindings()
    const mapCursorBindings = controlBindings.mapCursor

    useEffect(() => {
        if (!mapRef.current)
            return

        const map = mapRef.current
        let isDragButtonDown = false
        let isShiftDown = false
        let isPointerOverMap = false

        if (!enabled) {
            map.getCanvas().style.cursor = ''
            return
        }

        const getCursorOverride = () => {
            return map.getCanvas().dataset.cursorOverride
        }

        const setCursor = (cursor, {allowOverride = true} = {}) => {
            const cursorOverride = getCursorOverride()

            if (allowOverride && cursorOverride && !isDragButtonDown && !isShiftDown) {
                map.getCanvas().style.cursor = cursorOverride
                return
            }

            map.getCanvas().style.cursor = cursor
        }

        const setDefaultCursor = () => {
            isDragButtonDown = false
            setCursor(isShiftDown && isPointerOverMap ? 'nesw-resize' : 'crosshair')
        }

        const setActiveCursor = () => {
            if (isShiftDown && isPointerOverMap) {
                setCursor('nesw-resize', {allowOverride: false})
                return
            }

            if (isDragButtonDown) {
                setCursor('grabbing', {allowOverride: false})
                return
            }

            setCursor('crosshair')
        }

        const setCustomCursor = (event) => {
            const buttons = getMouseEventButtons(event)

            if (pressedMouseButtonsMatchBinding(buttons, mapCursorBindings.dragButton)) {
                isDragButtonDown = true
                setActiveCursor()
                return
            }

            if (pressedMouseButtonsMatchBinding(buttons, mapCursorBindings.pointerButton))
                setCursor('pointer', {allowOverride: false})
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
            delete map.getCanvas().dataset.cursorOverride
            map.getCanvas().style.cursor = ''
        }
    }, [mapRef, enabled, mapCursorBindings])
}