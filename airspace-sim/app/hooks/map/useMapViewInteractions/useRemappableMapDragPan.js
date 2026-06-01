'use client'

import {useEffect} from 'react'
import {
    getMouseEventButton,
    mouseButtonMatchesBinding,
    useControlBindings,
} from '@/app/contexts/ControlBindingsContext'
import {
    MAP_CURSOR_PRIORITIES,
    MAP_CURSOR_REQUESTS,
} from '../useMapCursorState'

export function useRemappableMapDragPan(mapRef, enabled, mapCursor) {
    const {controlBindings} = useControlBindings()
    const mapCursorBindings = controlBindings.mapCursor

    useEffect(() => {
        if (!mapRef.current || !mapCursor) return

        const map = mapRef.current
        const canvas = map.getCanvas()

        map.dragPan.disable()
        map.boxZoom.enable()

        if (!enabled) {
            mapCursor.clearCursorRequest(MAP_CURSOR_REQUESTS.DRAG_PAN)
            return
        }

        let isDragging = false
        let lastPoint = null

        const handleMouseDown = (event) => {
            if (event.shiftKey && event.button === 0)
                return

            if (!mouseButtonMatchesBinding(getMouseEventButton(event), mapCursorBindings.dragButton))
                return

            event.preventDefault()
            isDragging = true
            lastPoint = {
                x: event.clientX,
                y: event.clientY,
            }

            mapCursor.requestCursor(
                MAP_CURSOR_REQUESTS.DRAG_PAN,
                'grabbing',
                MAP_CURSOR_PRIORITIES.ACTIVE,
            )
        }

        const handleMouseMove = (event) => {
            if (!isDragging || !lastPoint) return

            event.preventDefault()

            const currentPoint = {
                x: event.clientX,
                y: event.clientY,
            }

            map.panBy([
                lastPoint.x - currentPoint.x,
                lastPoint.y - currentPoint.y,
            ], {
                animate: false,
            })

            lastPoint = currentPoint
        }

        const endDrag = () => {
            isDragging = false
            lastPoint = null
            mapCursor.clearCursorRequest(MAP_CURSOR_REQUESTS.DRAG_PAN)
        }

        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', endDrag)
        window.addEventListener('blur', endDrag)

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', endDrag)
            window.removeEventListener('blur', endDrag)
            endDrag()
        }
    }, [mapRef, enabled, mapCursor, mapCursorBindings.dragButton])
}