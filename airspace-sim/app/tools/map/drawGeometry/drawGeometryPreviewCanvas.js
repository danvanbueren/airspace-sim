import {buildGeometryGeoJson} from './drawGeometryGeometry.js'
import {GEOMETRY_PENDING_OPACITY} from './drawGeometryTypes.js'

export const DRAW_GEOMETRY_PREVIEW_OVERLAY_CLASS = 'draw-geometry-preview-overlay'

export function createDrawGeometryPreviewOverlay(map) {
    const mapCanvas = map.getCanvas()
    const host = mapCanvas.parentElement

    if (!host) {
        return null
    }

    const existingOverlay = host.querySelector(`.${DRAW_GEOMETRY_PREVIEW_OVERLAY_CLASS}`)

    if (existingOverlay) {
        existingOverlay.remove()
    }

    const overlay = document.createElement('canvas')

    overlay.className = DRAW_GEOMETRY_PREVIEW_OVERLAY_CLASS
    overlay.style.position = 'absolute'
    overlay.style.inset = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.pointerEvents = 'none'

    host.insertBefore(overlay, mapCanvas.nextSibling)
    resizeDrawGeometryPreviewOverlay(map, overlay)

    return overlay
}

export function resizeDrawGeometryPreviewOverlay(map, overlay) {
    const mapCanvas = map.getCanvas()
    const width = mapCanvas.clientWidth
    const height = mapCanvas.clientHeight
    const dpr = window.devicePixelRatio || 1

    overlay.width = Math.max(1, Math.round(width * dpr))
    overlay.height = Math.max(1, Math.round(height * dpr))
    overlay.style.width = `${width}px`
    overlay.style.height = `${height}px`
}

export function removeDrawGeometryPreviewOverlay(overlay) {
    overlay?.remove()
}

function projectRing(map, coordinates) {
    return coordinates
        .map((coordinate) => {
            const point = map.project(coordinate)

            if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
                return null
            }

            return {x: point.x, y: point.y}
        })
        .filter(Boolean)
}

function strokeRing(context, ring, scaleX, scaleY) {
    if (ring.length < 2) {
        return
    }

    context.beginPath()

    ring.forEach((point, index) => {
        const x = point.x * scaleX
        const y = point.y * scaleY

        if (index === 0) {
            context.moveTo(x, y)
            return
        }

        context.lineTo(x, y)
    })

    context.stroke()
}

function fillRing(context, ring, scaleX, scaleY) {
    if (ring.length < 3) {
        return
    }

    context.beginPath()

    ring.forEach((point, index) => {
        const x = point.x * scaleX
        const y = point.y * scaleY

        if (index === 0) {
            context.moveTo(x, y)
            return
        }

        context.lineTo(x, y)
    })

    context.closePath()
    context.fill()
}

function drawGeometryOnOverlay(context, map, shape, strokeColor, scaleX, scaleY) {
    const geometry = buildGeometryGeoJson(shape)

    if (!geometry) {
        return
    }

    const opacity = shape.status === 'committed' ? 1 : GEOMETRY_PENDING_OPACITY

    context.save()
    context.strokeStyle = strokeColor
    context.fillStyle = strokeColor
    context.globalAlpha = opacity
    context.lineWidth = 2 * scaleX
    context.lineCap = 'round'
    context.lineJoin = 'round'

    if (geometry.type === 'Polygon') {
        geometry.coordinates.forEach((ring) => {
            const projectedRing = projectRing(map, ring)

            if (shape.fillOpacity > 0) {
                context.globalAlpha = opacity * shape.fillOpacity
                fillRing(context, projectedRing, scaleX, scaleY)
                context.globalAlpha = opacity
            }

            strokeRing(context, projectedRing, scaleX, scaleY)
        })
        context.restore()
        return
    }

    if (geometry.type === 'LineString') {
        const projectedRing = projectRing(map, geometry.coordinates)

        strokeRing(context, projectedRing, scaleX, scaleY)
    }

    context.restore()
}

export function drawGeometryPreviewOnOverlay(map, overlay, shapes, strokeColor) {
    const context = overlay?.getContext('2d')

    if (!context || !Array.isArray(shapes)) {
        return
    }

    const scaleX = overlay.width / overlay.clientWidth
    const scaleY = overlay.height / overlay.clientHeight

    context.clearRect(0, 0, overlay.width, overlay.height)

    for (const shape of shapes) {
        drawGeometryOnOverlay(context, map, shape, strokeColor, scaleX, scaleY)
    }
}
