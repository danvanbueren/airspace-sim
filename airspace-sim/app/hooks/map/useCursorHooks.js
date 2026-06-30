'use client'

import { useEffect, useRef, useState } from 'react'

function isMapChromePointerTarget(target) {
    return target instanceof Element && Boolean(target.closest('.maplibregl-ctrl'))
}

export function useCursorHooks(mapRef, enabled, mapContainerRef, cursorBoxRef) {
    const [cursorInfo, setCursorInfo] = useState(null)
    const animationFrameRef = useRef(null)
    const latestPointerRef = useRef(null)

    useEffect(() => {
        if (!enabled || !mapRef.current || !mapContainerRef.current) {
            latestPointerRef.current = null
            setCursorInfo(null)

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }

            return
        }

        const map = mapRef.current
        const container = mapContainerRef.current

        const updateCursorInfo = () => {
            animationFrameRef.current = null

            if (!latestPointerRef.current)
                return

            const {x, y} = latestPointerRef.current
            const lngLat = map.unproject([x, y])

            // Perform direct DOM transform update for ultra-smooth positioning
            if (cursorBoxRef?.current) {
                const boxSize = {
                    width: cursorBoxRef.current.offsetWidth,
                    height: cursorBoxRef.current.offsetHeight,
                }
                const pos = getCursorBoxPosition(boxSize, {x, y}, mapContainerRef)
                cursorBoxRef.current.style.transform = `translate3d(${pos.left}px, ${pos.top}px, 0)`
            }

            setCursorInfo({
                x,
                y,
                lat: lngLat.lat,
                lng: lngLat.lng,
            })
        }

        const clearCursorInfo = () => {
            latestPointerRef.current = null
            setCursorInfo(null)

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }

        const scheduleCursorUpdate = (event) => {
            if (isMapChromePointerTarget(event.target)) {
                clearCursorInfo()
                return
            }

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
            clearCursorInfo()
        }

        const handleMapMove = () => {
            if (!latestPointerRef.current)
                return

            if (animationFrameRef.current)
                return

            animationFrameRef.current = requestAnimationFrame(updateCursorInfo)
        }

        container.addEventListener('pointermove', scheduleCursorUpdate)
        container.addEventListener('pointerdown', scheduleCursorUpdate)
        container.addEventListener('pointerleave', handlePointerLeave)
        map.on('move', handleMapMove)

        return () => {
            container.removeEventListener('pointermove', scheduleCursorUpdate)
            container.removeEventListener('pointerdown', scheduleCursorUpdate)
            container.removeEventListener('pointerleave', handlePointerLeave)
            map.off('move', handleMapMove)

            latestPointerRef.current = null
            setCursorInfo(null)

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
                animationFrameRef.current = null
            }
        }
    }, [mapRef, enabled, mapContainerRef, cursorBoxRef])

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