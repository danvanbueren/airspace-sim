import maplibregl from 'maplibre-gl'
import {
    formatBearingRange,
    getLabelLongitudeCopies,
} from './bearingRangeGeometry.js'

function createLabelElement(line) {
    const element = document.createElement('div')

    element.style.padding = '6px 8px'
    element.style.borderRadius = '4px'
    element.style.background = 'rgba(0, 0, 0, 0.75)'
    element.style.color = '#fff'
    element.style.fontSize = '12px'
    element.style.fontFamily = 'monospace'
    element.style.pointerEvents = 'none'
    element.style.whiteSpace = 'pre'
    element.style.opacity = '1'
    element.textContent = formatBearingRange(line)

    return element
}

function getLabelAnchor(line) {
    const isMoreVertical = Math.abs(line.endPoint.y - line.startPoint.y)
        > Math.abs(line.endPoint.x - line.startPoint.x)

    return {
        anchor: isMoreVertical ? 'left' : 'bottom',
        offset: isMoreVertical ? [14, 0] : [0, -12],
    }
}

export class BearingRangeLabelManager {
    constructor() {
        this.markers = []
    }

    remove() {
        this.markers.forEach((marker) => marker.remove())
        this.markers = []
    }

    sync(map, lines, {previewLine = null} = {}) {
        if (!map) {
            this.remove()
            return
        }

        const bounds = map.getBounds()
        const west = bounds.getWest()
        const east = bounds.getEast()
        const linesToLabel = previewLine ? [...lines, previewLine] : lines

        this.remove()

        linesToLabel.forEach((line) => {
            const {anchor, offset} = getLabelAnchor(line)
            const labelLongitudes = getLabelLongitudeCopies(line.midpoint.lng, west, east)

            labelLongitudes.forEach((lng) => {
                const marker = new maplibregl.Marker({
                    element: createLabelElement(line),
                    anchor,
                    offset,
                })
                    .setLngLat({lng, lat: line.midpoint.lat})
                    .addTo(map)

                this.markers.push(marker)
            })
        })
    }
}
