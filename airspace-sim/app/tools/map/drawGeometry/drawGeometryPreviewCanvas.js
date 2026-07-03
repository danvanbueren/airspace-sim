import {buildDisplayGeometryGeoJson} from './drawGeometryGeometry.js'
import {isMapLocationVisible} from './drawGeometryMapBounds.js'
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
    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1

    overlay.width = Math.max(1, Math.round(width * dpr))
    overlay.height = Math.max(1, Math.round(height * dpr))
    overlay.style.width = `${width}px`
    overlay.style.height = `${height}px`
}

export function removeDrawGeometryPreviewOverlay(overlay) {
    overlay?.remove()
}

function projectRing(map, coordinates) {
    return coordinates.map(([lng, lat]) => {
        if (!isMapLocationVisible(map, lng, lat)) {
            return null
        }

        const point = map.project([lng, lat])

        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
            return null
        }

        return {x: point.x, y: point.y}
    })
}

function withViewportClip(context, callback) {
    context.save()
    context.beginPath()
    context.rect(0, 0, context.canvas.width, context.canvas.height)
    context.clip()
    callback()
    context.restore()
}

function strokeRing(context, ring, scaleX, scaleY) {
    if (ring.length < 2) {
        return
    }

    withViewportClip(context, () => {
        let pathOpen = false

        for (const point of ring) {
            if (!point) {
                if (pathOpen) {
                    context.stroke()
                    pathOpen = false
                    context.beginPath()
                }

                continue
            }

            const x = point.x * scaleX
            const y = point.y * scaleY

            if (!pathOpen) {
                context.beginPath()
                context.moveTo(x, y)
                pathOpen = true
                continue
            }

            context.lineTo(x, y)
        }

        if (pathOpen) {
            context.stroke()
        }
    })
}

function fillRing(context, ring, scaleX, scaleY) {
    if (ring.filter(Boolean).length < 3) {
        return
    }

    withViewportClip(context, () => {
        let pathOpen = false

        for (const point of ring) {
            if (!point) {
                if (pathOpen) {
                    context.fill()
                    pathOpen = false
                    context.beginPath()
                }

                continue
            }

            const x = point.x * scaleX
            const y = point.y * scaleY

            if (!pathOpen) {
                context.beginPath()
                context.moveTo(x, y)
                pathOpen = true
                continue
            }

            context.lineTo(x, y)
        }

        if (!pathOpen) {
            return
        }

        context.closePath()
        context.fill()
    })
}

function strokeProjectedLine(context, map, from, to, strokeColor, scaleX, scaleY, opacity) {
    if (
        !isMapLocationVisible(map, from.lng, from.lat)
        || !isMapLocationVisible(map, to.lng, to.lat)
    ) {
        return
    }

    const fromPoint = map.project([from.lng, from.lat])
    const toPoint = map.project([to.lng, to.lat])

    if (
        !Number.isFinite(fromPoint.x) || !Number.isFinite(fromPoint.y)
        || !Number.isFinite(toPoint.x) || !Number.isFinite(toPoint.y)
    ) {
        return
    }

    context.save()
    context.strokeStyle = strokeColor
    context.globalAlpha = opacity
    context.lineWidth = 2 * scaleX
    context.lineCap = 'round'
    withViewportClip(context, () => {
        context.beginPath()
        context.moveTo(fromPoint.x * scaleX, fromPoint.y * scaleY)
        context.lineTo(toPoint.x * scaleX, toPoint.y * scaleY)
        context.stroke()
    })
    context.restore()
}

function drawConstructionPreview(context, map, constructionPreview, strokeColor, scaleX, scaleY) {
    if (!constructionPreview?.axisLine) {
        return
    }

    strokeProjectedLine(
        context,
        map,
        constructionPreview.axisLine.from,
        constructionPreview.axisLine.to,
        strokeColor,
        scaleX,
        scaleY,
        GEOMETRY_PENDING_OPACITY,
    )
}

function drawGeometryOnOverlay(context, map, shape, defaultStrokeColor, themeMode, scaleX, scaleY) {
    const geometry = buildDisplayGeometryGeoJson(shape)

    if (!geometry) {
        return
    }

    const strokeColor = shape.strokeColorsByMode?.[themeMode] ?? defaultStrokeColor
    const fillColor = shape.fillColorsByMode?.[themeMode] ?? strokeColor
    const opacity = shape.status === 'committed' ? 1 : GEOMETRY_PENDING_OPACITY

    context.save()
    context.strokeStyle = strokeColor
    context.fillStyle = fillColor
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

export function drawGeometryPreviewOnOverlay(
    map,
    overlay,
    shapes,
    defaultStrokeColor,
    themeMode = 'dark',
    constructionPreview = null,
) {
    const context = overlay?.getContext('2d')

    if (!context || !Array.isArray(shapes)) {
        return
    }

    const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1
    const scaleX = dpr
    const scaleY = dpr

    context.clearRect(0, 0, overlay.width, overlay.height)

    for (const shape of shapes) {
        drawGeometryOnOverlay(context, map, shape, defaultStrokeColor, themeMode, scaleX, scaleY)
    }

    drawConstructionPreview(context, map, constructionPreview, defaultStrokeColor, scaleX, scaleY)
}
