'use client'

import { useEffect, useRef, useState } from 'react'

export function useCursorHooks(mapRef, mapReady, mapContainerRef) {
    const [cursorInfo, setCursorInfo] = useState(null)
    const animationFrameRef = useRef(null)
    const latestPointerRef = useRef(null)

    useEffect(() => {
        if (!mapReady || !mapRef.current || !mapContainerRef.current)
            return

        const map = mapRef.current
        const container = mapContainerRef.current

        const updateCursorInfo = () => {
            animationFrameRef.current = null

            if (!latestPointerRef.current)
                return

            const {x, y} = latestPointerRef.current
            const lngLat = map.unproject([x, y])

            setCursorInfo({
                x,
                y,
                lat: lngLat.lat,
                lng: lngLat.lng,
            })
        }

        const scheduleCursorUpdate = (event) => {
            const bounds = container.getBoundingClientRect()

            latestPointerRef.current = {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            }

            if (animationFrameRef.current)
                return

            animationFrameRef.current = requestAnimationFrame(updateCursorInfo)
        }

        const handlePointerLeave = () => {
            latestPointerRef.current = null
            setCursorInfo(null)
        }

        container.addEventListener('pointermove', scheduleCursorUpdate)
        container.addEventListener('pointerdown', scheduleCursorUpdate)
        container.addEventListener('pointerleave', handlePointerLeave)

        return () => {
            container.removeEventListener('pointermove', scheduleCursorUpdate)
            container.removeEventListener('pointerdown', scheduleCursorUpdate)
            container.removeEventListener('pointerleave', handlePointerLeave)

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }
    }, [mapRef, mapReady, mapContainerRef])

    return cursorInfo
}

export function getCursorBoxPosition(cursorBoxSize, cursorInfo, mapContainerRef) {
    if (!cursorInfo)
        return {}

    const offset = 12
    const edgePadding = 8
    const containerWidth = mapContainerRef.current?.clientWidth ?? window.innerWidth
    const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight
    const boxWidth = cursorBoxSize.width
    const boxHeight = cursorBoxSize.height

    let left = cursorInfo.x + offset
    let top = cursorInfo.y + offset

    if (boxWidth && left + boxWidth > containerWidth - edgePadding)
        left = cursorInfo.x - boxWidth - offset

    if (boxHeight && top + boxHeight > containerHeight - edgePadding)
        top = cursorInfo.y - boxHeight - offset

    return {
        left: Math.max(edgePadding, left),
        top: Math.max(edgePadding, top)
    }
}