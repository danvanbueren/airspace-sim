'use client'

import {useEffect} from 'react'

export function useMapCursor(mapRef, enabled) {
    useEffect(() => {
        if (!mapRef.current)
            return

        const map = mapRef.current
        let isLeftButtonDown = false
        let isShiftDown = false
        let isPointerOverMap = false

        if (!enabled) {
            map.getCanvas().style.cursor = ''
            return
        }

        const setDefaultCursor = () => {
            isLeftButtonDown = false
            map.getCanvas().style.cursor = isShiftDown && isPointerOverMap ? 'nesw-resize' : 'crosshair'
        }

        const setActiveCursor = () => {
            if (isShiftDown && isPointerOverMap) {
                map.getCanvas().style.cursor = 'nesw-resize'
                return
            }

            if (isLeftButtonDown) {
                map.getCanvas().style.cursor = 'grabbing'
                return
            }

            map.getCanvas().style.cursor = 'crosshair'
        }

        const setCustomCursor = (e) => {
            if (e.originalEvent.buttons === 1) {
                isLeftButtonDown = true
                setActiveCursor()
            }

            if (e.originalEvent.buttons === 2)
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
    }, [mapRef, enabled])
}