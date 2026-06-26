import {
    buildCopiedLine,
    getLineWorldCopyOffsets,
} from './bearingRangeGeometry.js'

export const PREVIEW_OVERLAY_CLASS = 'bearing-range-preview-overlay'

export function createPreviewOverlay(map) {
    const mapCanvas = map.getCanvas()
    const host = mapCanvas.parentElement

    if (!host) {
        return null
    }

    const existingOverlay = host.querySelector(`.${PREVIEW_OVERLAY_CLASS}`)

    if (existingOverlay) {
        existingOverlay.remove()
    }

    const overlay = document.createElement('canvas')

    overlay.className = PREVIEW_OVERLAY_CLASS
    overlay.style.position = 'absolute'
    overlay.style.inset = '0'
    overlay.style.width = '100%'
    overlay.style.height = '100%'
    overlay.style.pointerEvents = 'none'

    host.insertBefore(overlay, mapCanvas.nextSibling)
    resizePreviewOverlay(map, overlay)

    return overlay
}

export function resizePreviewOverlay(map, overlay) {
    const mapCanvas = map.getCanvas()
    const width = mapCanvas.clientWidth
    const height = mapCanvas.clientHeight
    const dpr = window.devicePixelRatio || 1

    overlay.width = Math.max(1, Math.round(width * dpr))
    overlay.height = Math.max(1, Math.round(height * dpr))
    overlay.style.width = `${width}px`
    overlay.style.height = `${height}px`
}

export function clearPreviewOverlay(overlay) {
    if (!overlay) {
        return
    }

    const context = overlay.getContext('2d')

    if (context) {
        context.clearRect(0, 0, overlay.width, overlay.height)
    }
}

export function removePreviewOverlay(overlay) {
    overlay?.remove()
}

function buildLineScreenSegments(map, line) {
    const startPoint = map.project([line.start.lng, line.start.lat])
    const endPoint = map.project([line.end.lng, line.end.lat])

    if (
        !Number.isFinite(startPoint.x) || !Number.isFinite(startPoint.y)
        || !Number.isFinite(endPoint.x) || !Number.isFinite(endPoint.y)
    ) {
        return []
    }

    return [[
        {x: startPoint.x, y: startPoint.y},
        {x: endPoint.x, y: endPoint.y},
    ]]
}

function strokeScreenSegments(context, segments, scaleX, scaleY) {
    segments.forEach((segment) => {
        context.beginPath()
        segment.forEach((point, index) => {
            const x = point.x * scaleX
            const y = point.y * scaleY

            if (index === 0) {
                context.moveTo(x, y)
                return
            }

            context.lineTo(x, y)
        })
        context.stroke()
    })
}

function drawDashedScreenLine(context, fromPoint, toPoint, scaleX, scaleY, lineColor) {
    context.save()
    context.setLineDash([10 * scaleX, 8 * scaleX])
    context.globalAlpha = 0.7
    context.strokeStyle = lineColor
    context.lineWidth = 2 * scaleX
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(fromPoint.x * scaleX, fromPoint.y * scaleY)
    context.lineTo(toPoint.x * scaleX, toPoint.y * scaleY)
    context.stroke()
    context.restore()
}

export function drawPreviewOnOverlay(map, overlay, line, lineColor, {showNormalizationGuide = false} = {}) {
    const context = overlay.getContext('2d')

    if (!context || !line) {
        return
    }

    const scaleX = overlay.width / overlay.clientWidth
    const scaleY = overlay.height / overlay.clientHeight
    const bounds = map.getBounds()
    const west = bounds.getWest()
    const east = bounds.getEast()

    context.clearRect(0, 0, overlay.width, overlay.height)
    context.strokeStyle = lineColor
    context.lineWidth = 4 * scaleX
    context.lineCap = 'round'
    context.lineJoin = 'round'

    const worldCopyOffsets = getLineWorldCopyOffsets(line, west, east)
    let drewSolidLine = false

    worldCopyOffsets.forEach((worldCopyOffset) => {
        const copiedLine = buildCopiedLine(line, worldCopyOffset)
        const segments = buildLineScreenSegments(map, copiedLine)

        if (segments.length === 0) {
            return
        }

        strokeScreenSegments(context, segments, scaleX, scaleY)
        drewSolidLine = true
    })

    if (!drewSolidLine) {
        strokeScreenSegments(context, buildLineScreenSegments(map, line), scaleX, scaleY)
    }

    if (!showNormalizationGuide || !line.isEndNormalized || !line.startMapPoint || !line.endMapPoint) {
        return
    }

    const startPoint = {x: line.startMapPoint.x, y: line.startMapPoint.y}
    const cursorPoint = {x: line.endMapPoint.x, y: line.endMapPoint.y}

    if (
        Number.isFinite(startPoint.x) && Number.isFinite(startPoint.y)
        && Number.isFinite(cursorPoint.x) && Number.isFinite(cursorPoint.y)
    ) {
        drawDashedScreenLine(context, startPoint, cursorPoint, scaleX, scaleY, lineColor)
    }
}
