import {buildCircleRingCoordinates} from './scopeCircleGeometry.js'

export const SCOPE_CIRCLE_OVERLAY_CLASS = 'group-criteria-circle-preview-overlay'

export function createScopeCircleOverlay(map) {
    const mapCanvas = map.getCanvas()
    const host = mapCanvas.parentElement

    if (!host) {
        return null
    }

    const existingOverlay = host.querySelector(`.${SCOPE_CIRCLE_OVERLAY_CLASS}`)

    if (existingOverlay) {
        existingOverlay.remove()
    }

    const overlay = document.createElement('canvas')

    overlay.className = SCOPE_CIRCLE_OVERLAY_CLASS
    overlay.style.position = 'absolute'
    overlay.style.inset = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.pointerEvents = 'none'

    host.insertBefore(overlay, mapCanvas.nextSibling)
    resizeScopeCircleOverlay(map, overlay)

    return overlay
}

export function resizeScopeCircleOverlay(map, overlay) {
    const mapCanvas = map.getCanvas()
    const width = mapCanvas.clientWidth
    const height = mapCanvas.clientHeight
    const dpr = window.devicePixelRatio || 1

    overlay.width = Math.max(1, Math.round(width * dpr))
    overlay.height = Math.max(1, Math.round(height * dpr))
    overlay.style.width = `${width}px`
    overlay.style.height = `${height}px`
}

export function removeScopeCircleOverlay(overlay) {
    overlay?.remove()
}

function projectRingToScreen(map, ring) {
    return ring.map(([lng, lat]) => {
        const point = map.project([lng, lat])

        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
            return null
        }

        return {x: point.x, y: point.y}
    }).filter(Boolean)
}

export function drawScopeCircleOnOverlay(
    map,
    overlay,
    centerLng,
    centerLat,
    strokeColor,
    radiusNm,
) {
    const context = overlay.getContext('2d')

    if (!context || !Number.isFinite(centerLng) || !Number.isFinite(centerLat)) {
        return
    }

    const scaleX = overlay.width / overlay.clientWidth
    const scaleY = overlay.height / overlay.clientHeight
    const ring = buildCircleRingCoordinates(centerLng, centerLat, radiusNm)
    const screenPoints = projectRingToScreen(map, ring)

    context.clearRect(0, 0, overlay.width, overlay.height)

    if (screenPoints.length < 2) {
        return
    }

    context.strokeStyle = strokeColor
    context.lineWidth = 2 * scaleX
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()

    screenPoints.forEach((point, index) => {
        const x = point.x * scaleX
        const y = point.y * scaleY

        if (index === 0) {
            context.moveTo(x, y)
            return
        }

        context.lineTo(x, y)
    })

    context.closePath()
    context.stroke()
}
