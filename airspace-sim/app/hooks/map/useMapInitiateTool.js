'use client'

import {useEffect, useRef, useState} from 'react'
import {useMapState} from '@/app/contexts/MapStateContext'
import {calculateBearingAndRange} from '@/app/tools/map/bearingRangeGeometry'

export function useMapInitiateTool(mapRef, mapReady, {
    initiateTrack,
    updateTrackManagementWindow,
    getTrack,
    upsertManualTrack,
    trackMapLayer,
    trackManagementWindows,
}) {
    const {
        activeMapAction,
        setActiveMapAction,
        reinitiateTargetTrackId,
        setReinitiateTargetTrackId,
    } = useMapState()

    const activeMapActionRef = useRef(activeMapAction)
    activeMapActionRef.current = activeMapAction

    const reinitiateTargetTrackIdRef = useRef(reinitiateTargetTrackId)
    reinitiateTargetTrackIdRef.current = reinitiateTargetTrackId

    const isDraggingRef = useRef(false)
    const dragStartRef = useRef(null) // { point, lngLat }
    const canvasOverlayRef = useRef(null)

    // Escape listener to cancel action
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setActiveMapAction(null)
                setReinitiateTargetTrackId(null)
                isDraggingRef.current = false
                if (canvasOverlayRef.current) {
                    canvasOverlayRef.current.remove()
                    canvasOverlayRef.current = null
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [setActiveMapAction, setReinitiateTargetTrackId])

    // Right click listener to cancel/deactivate (anywhere in window)
    useEffect(() => {
        if (!mapReady || !mapRef.current || !activeMapAction) return

        const handleContextMenu = (event) => {
            event.preventDefault()
            event.stopPropagation()
            setActiveMapAction(null)
            setReinitiateTargetTrackId(null)
            isDraggingRef.current = false
            if (canvasOverlayRef.current) {
                canvasOverlayRef.current.remove()
                canvasOverlayRef.current = null
            }
        }

        window.addEventListener('contextmenu', handleContextMenu, true)
        return () => {
            window.removeEventListener('contextmenu', handleContextMenu, true)
        }
    }, [mapReady, mapRef, activeMapAction, setActiveMapAction, setReinitiateTargetTrackId])

    // Mouse handlers on canvas
    useEffect(() => {
        if (!mapReady || !mapRef.current || !activeMapAction) {
            isDraggingRef.current = false
            if (canvasOverlayRef.current) {
                canvasOverlayRef.current.remove()
                canvasOverlayRef.current = null
            }
            return
        }

        const map = mapRef.current
        const canvas = map.getCanvas()

        const getMapPointFromEvent = (event) => {
            const bounds = canvas.getBoundingClientRect()
            return {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
            }
        }

        const handleMouseDown = (event) => {
            if (event.button !== 0) return // left click only

            const mapPoint = getMapPointFromEvent(event)
            const lngLat = map.unproject([mapPoint.x, mapPoint.y])

            // If RE_INITIATE and target track not selected, try to select track
            if (activeMapActionRef.current === 'RE_INITIATE' && !reinitiateTargetTrackIdRef.current) {
                // Find track at point
                const layers = ['tracks-symbols', 'tracks-labels'].filter((l) => map.getLayer(l))
                let trackId = null
                if (layers.length > 0) {
                    const features = map.queryRenderedFeatures([
                        [mapPoint.x - 8, mapPoint.y - 8],
                        [mapPoint.x + 8, mapPoint.y + 8],
                    ], {layers})
                    trackId = features[0]?.properties?.trackId ?? features[0]?.properties?.id
                }

                if (trackId) {
                    setReinitiateTargetTrackId(trackId)
                }
                return
            }

            // Otherwise start click-and-drag for vector input
            event.preventDefault()
            event.stopPropagation()

            dragStartRef.current = {
                point: mapPoint,
                lngLat,
            }
            isDraggingRef.current = true

            // Create Canvas
            if (canvasOverlayRef.current) {
                canvasOverlayRef.current.remove()
            }
            const overlay = document.createElement('canvas')
            overlay.style.position = 'absolute'
            overlay.style.inset = '0'
            overlay.style.width = '100%'
            overlay.style.height = '100%'
            overlay.style.pointerEvents = 'none'
            overlay.style.zIndex = '9999'
            canvas.parentElement.appendChild(overlay)
            canvasOverlayRef.current = overlay

            // Resize canvas initial
            const width = canvas.clientWidth
            const height = canvas.clientHeight
            const dpr = window.devicePixelRatio || 1
            overlay.width = Math.max(1, Math.round(width * dpr))
            overlay.height = Math.max(1, Math.round(height * dpr))
            overlay.style.width = `${width}px`
            overlay.style.height = `${height}px`
        }

        const handleMouseMove = (event) => {
            if (!isDraggingRef.current || !dragStartRef.current || !canvasOverlayRef.current) return

            event.preventDefault()
            event.stopPropagation()

            const mapPoint = getMapPointFromEvent(event)
            const currentLngLat = map.unproject([mapPoint.x, mapPoint.y])

            // Draw vector
            const overlay = canvasOverlayRef.current
            const ctx = overlay.getContext('2d')
            const dpr = window.devicePixelRatio || 1
            const width = canvas.clientWidth
            const height = canvas.clientHeight
            overlay.width = Math.max(1, Math.round(width * dpr))
            overlay.height = Math.max(1, Math.round(height * dpr))
            overlay.style.width = `${width}px`
            overlay.style.height = `${height}px`
            ctx.scale(dpr, dpr)
            ctx.clearRect(0, 0, width, height)

            const startPoint = map.project([dragStartRef.current.lngLat.lng, dragStartRef.current.lngLat.lat])
            const endPoint = mapPoint

            // Calculate bearing and range
            const {bearingDegrees, rangeNauticalMiles} = calculateBearingAndRange(
                dragStartRef.current.lngLat,
                currentLngLat
            )
            const heading = Math.round(bearingDegrees)
            const speed = Math.max(1, Math.round(rangeNauticalMiles * 10))

            // Main vector line
            ctx.strokeStyle = '#FFBF00' // amber color
            ctx.lineWidth = 3
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(startPoint.x, startPoint.y)
            ctx.lineTo(endPoint.x, endPoint.y)
            ctx.stroke()

            // Start dot
            ctx.fillStyle = '#FFBF00'
            ctx.beginPath()
            ctx.arc(startPoint.x, startPoint.y, 4, 0, Math.PI * 2)
            ctx.fill()

            // Arrowhead at the end
            const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x)
            ctx.beginPath()
            ctx.moveTo(endPoint.x, endPoint.y)
            ctx.lineTo(
                endPoint.x - 12 * Math.cos(angle - Math.PI / 6),
                endPoint.y - 12 * Math.sin(angle - Math.PI / 6)
            )
            ctx.lineTo(
                endPoint.x - 12 * Math.cos(angle + Math.PI / 6),
                endPoint.y - 12 * Math.sin(angle + Math.PI / 6)
            )
            ctx.closePath()
            ctx.fill()

            // Text info label
            ctx.font = 'bold 12px monospace'
            ctx.fillStyle = '#FFBF00'
            ctx.shadowColor = 'black'
            ctx.shadowBlur = 4
            const text = `${heading.toString().padStart(3, '0')}° / ${speed} kt`
            ctx.fillText(text, endPoint.x + 10, endPoint.y - 10)
        }

        const handleMouseUp = (event) => {
            if (!isDraggingRef.current || !dragStartRef.current) return

            event.preventDefault()
            event.stopPropagation()

            isDraggingRef.current = false
            if (canvasOverlayRef.current) {
                canvasOverlayRef.current.remove()
                canvasOverlayRef.current = null
            }

            const mapPoint = getMapPointFromEvent(event)
            const endLngLat = map.unproject([mapPoint.x, mapPoint.y])

            const {bearingDegrees, rangeNauticalMiles} = calculateBearingAndRange(
                dragStartRef.current.lngLat,
                endLngLat
            )
            const heading = Math.round(bearingDegrees)
            const speed = Math.max(1, Math.round(rangeNauticalMiles * 10))
            const startLngLat = dragStartRef.current.lngLat
            const startPoint = dragStartRef.current.point

            if (activeMapActionRef.current === 'INITIATE') {
                // Initiate track with heading and speed pre-filled
                initiateTrack({
                    x: startPoint.x,
                    y: startPoint.y,
                    lngLat: startLngLat,
                    heading,
                    speed,
                })
            } else if (activeMapActionRef.current === 'RE_INITIATE' && reinitiateTargetTrackIdRef.current) {
                const trackId = reinitiateTargetTrackIdRef.current
                const existingTrack = getTrack(trackId) ?? trackMapLayer.getTrack(trackId)
                if (existingTrack) {
                    const updatedTrack = {
                        ...existingTrack,
                        longitude: startLngLat.lng,
                        latitude: startLngLat.lat,
                        heading,
                        speed,
                    }
                    upsertManualTrack(updatedTrack)
                    trackMapLayer.upsertTrack(updatedTrack)

                    // Sync corresponding track management window if open
                    const windowEntry = trackManagementWindows.find(w => w.trackId === trackId)
                    if (windowEntry) {
                        updateTrackManagementWindow(windowEntry.id, {
                            lngLat: startLngLat,
                            heading,
                            speed,
                        })
                    }
                }
            }

            // Turn off action
            setActiveMapAction(null)
            setReinitiateTargetTrackId(null)
        }

        canvas.addEventListener('mousedown', handleMouseDown, true)
        window.addEventListener('mousemove', handleMouseMove, true)
        window.addEventListener('mouseup', handleMouseUp, true)

        return () => {
            canvas.removeEventListener('mousedown', handleMouseDown, true)
            window.removeEventListener('mousemove', handleMouseMove, true)
            window.removeEventListener('mouseup', handleMouseUp, true)
            if (canvasOverlayRef.current) {
                canvasOverlayRef.current.remove()
                canvasOverlayRef.current = null
            }
        }
    }, [
        mapReady,
        mapRef,
        activeMapAction,
        initiateTrack,
        getTrack,
        trackMapLayer,
        upsertManualTrack,
        trackManagementWindows,
        updateTrackManagementWindow,
        setActiveMapAction,
        setReinitiateTargetTrackId,
    ])

    return {
        isDragging: isDraggingRef.current,
    }
}
