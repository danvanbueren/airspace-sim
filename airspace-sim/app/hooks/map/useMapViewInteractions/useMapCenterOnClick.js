'use client'

import {useEffect, useRef} from 'react'
import {
    getMouseEventButton,
    keyMatchesBinding,
    mouseButtonMatchesBinding,
    useControlBindings,
} from '@/app/contexts/ControlBindingsContext'

function centerMapOnCoordinates(map, longitude, latitude) {
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        return
    }

    map.easeTo({
        center: [longitude, latitude],
        zoom: map.getZoom(),
        duration: 0,
        essential: true,
    })
}

export function useMapCenterOnClick(mapRef, enabled, keyboardCenterEnabled = true) {
    const {controlBindings} = useControlBindings()
    const centerButton = controlBindings.mapCursor.centerButton
    const centerMapKeys = controlBindings.keyboardCamera.centerMap
    const lastPointerPositionRef = useRef(null)

    useEffect(() => {
        if (!enabled || !mapRef.current) return

        const map = mapRef.current
        const canvas = map.getCanvas()
        const container = map.getContainer()

        const handlePointerMove = (event) => {
            const bounds = canvas.getBoundingClientRect()
            lastPointerPositionRef.current = {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            }
        }

        const handlePointerLeave = () => {
            lastPointerPositionRef.current = null
        }

        const handleMouseDown = (event) => {
            if (event.shiftKey && event.button === 0) {
                return
            }

            if (!mouseButtonMatchesBinding(getMouseEventButton(event), centerButton)) {
                return
            }

            event.preventDefault()

            const bounds = canvas.getBoundingClientRect()
            const x = event.clientX - bounds.left
            const y = event.clientY - bounds.top
            const {lng, lat} = map.unproject([x, y])

            centerMapOnCoordinates(map, lng, lat)
        }

        const handleKeyDown = (event) => {
            if (!keyboardCenterEnabled || centerMapKeys.length === 0) {
                return
            }

            if (!keyMatchesBinding(event.key, centerMapKeys)) {
                return
            }

            event.preventDefault()

            const pointerPosition = lastPointerPositionRef.current

            if (pointerPosition) {
                const {lng, lat} = map.unproject([pointerPosition.x, pointerPosition.y])
                centerMapOnCoordinates(map, lng, lat)
                return
            }

            const mapCenter = map.getCenter()
            centerMapOnCoordinates(map, mapCenter.lng, mapCenter.lat)
        }

        container.addEventListener('pointermove', handlePointerMove)
        container.addEventListener('pointerleave', handlePointerLeave)
        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            container.removeEventListener('pointermove', handlePointerMove)
            container.removeEventListener('pointerleave', handlePointerLeave)
            canvas.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('keydown', handleKeyDown)
            lastPointerPositionRef.current = null
        }
    }, [mapRef, enabled, keyboardCenterEnabled, centerButton, centerMapKeys])
}
