'use client'

import {useEffect} from 'react'
import {
    getMouseEventButton,
    mouseButtonMatchesBinding,
    useControlBindings,
} from '@/app/contexts/ControlBindingsContext'

export function useRemappableMapDragPan(mapRef, enabled) {
    const {controlBindings} = useControlBindings()
    const mapCursorBindings = controlBindings.mapCursor

    useEffect(() => {
        if (!mapRef.current) return

        const map = mapRef.current
        const canvas = map.getCanvas()

        map.dragPan.disable()
        map.boxZoom.enable()

        if (!enabled) return

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

            canvas.style.cursor = 'grabbing'
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
    }, [mapRef, enabled, mapCursorBindings.dragButton])
}