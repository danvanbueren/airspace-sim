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
        let isGrabButtonDown = false
        let isShiftDown = false
        let isPointerOverMap = false

        if (!enabled) {
            map.getCanvas().style.cursor = ''
            return
        }

        const setDefaultCursor = () => {
            isGrabButtonDown = false
            map.getCanvas().style.cursor = isShiftDown && isPointerOverMap ? 'nesw-resize' : 'crosshair'
        }

        const setActiveCursor = () => {
            if (isShiftDown && isPointerOverMap) {
                map.getCanvas().style.cursor = 'nesw-resize'
                return
            }

            if (isGrabButtonDown) {
                map.getCanvas().style.cursor = 'grabbing'
                return
            }

            map.getCanvas().style.cursor = 'crosshair'
        }

        const setCustomCursor = (event) => {
            const buttons = getMouseEventButtons(event)

            if (pressedMouseButtonsMatchBinding(buttons, mapCursorBindings.grabButton)) {
                isGrabButtonDown = true
                setActiveCursor()
            }

            if (pressedMouseButtonsMatchBinding(buttons, mapCursorBindings.pointerButton))
                map.getCanvas().style.cursor = 'pointer'
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
            map.getCanvas().style.cursor = ''
        }
    }, [mapRef, enabled, mapCursorBindings])
}