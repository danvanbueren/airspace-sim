import assert from 'node:assert/strict'
import test from 'node:test'
import {drawGeometryPreviewOnOverlay} from '../../app/tools/map/drawGeometry/drawGeometryPreviewCanvas.js'
import {createGeometryShape} from '../../app/tools/map/drawGeometry/drawGeometryModels.js'
import {GEOMETRY_SHAPE_TYPES, GEOMETRY_STATUS} from '../../app/tools/map/drawGeometry/drawGeometryTypes.js'

function createRecordingContext() {
    const commands = []

    return {
        commands,
        canvas: {width: 800, height: 400},
        save() {
            commands.push('save')
        },
        restore() {
            commands.push('restore')
        },
        beginPath() {
            commands.push('beginPath')
        },
        rect() {
            commands.push('rect')
        },
        clip() {
            commands.push('clip')
        },
        moveTo(x, y) {
            commands.push({type: 'moveTo', x, y})
        },
        lineTo(x, y) {
            commands.push({type: 'lineTo', x, y})
        },
        closePath() {
            commands.push('closePath')
        },
        stroke() {
            commands.push('stroke')
        },
        fill() {
            commands.push('fill')
        },
        clearRect() {
            commands.push('clearRect')
        },
    }
}

test('preview overlay clips geometry to the viewport instead of dropping off-screen points', () => {
    const context = createRecordingContext()
    const overlay = {
        width: 800,
        height: 400,
        clientWidth: 400,
        clientHeight: 200,
        getContext: () => context,
    }
    const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.CIRCLE)
    shape.params = {
        center: {lat: 0, lng: 0},
        radiusNm: 20,
    }
    shape.status = GEOMETRY_STATUS.COMMITTED

    const map = {
        project([lng, lat]) {
            if (lng === 0 && lat === 0) {
                return {x: 200, y: 100}
            }

            if (lng === 1 && lat === 0) {
                return {x: 5000, y: 100}
            }

            return {x: -5000, y: 100}
        },
    }

    drawGeometryPreviewOnOverlay(map, overlay, [shape], '#ffffff')

    assert.ok(context.commands.includes('clip'))
    assert.ok(context.commands.includes('save'))
    assert.ok(context.commands.includes('restore'))
    assert.equal(
        context.commands.filter((command) => command === 'stroke').length,
        1,
    )
})
