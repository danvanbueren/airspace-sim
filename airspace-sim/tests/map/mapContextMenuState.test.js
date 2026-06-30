import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {createMapContextMenuElement} from '../../app/hooks/map/useMapContextMenuState.js'
import {createGeometryShape} from '../../app/tools/map/drawGeometry/drawGeometryModels.js'
import {GEOMETRY_SHAPE_TYPES} from '../../app/tools/map/drawGeometry/drawGeometryTypes.js'

describe('createMapContextMenuElement', () => {
    it('preserves geometry on the context menu element', () => {
        const geometry = createGeometryShape(GEOMETRY_SHAPE_TYPES.CIRCLE)
        const element = createMapContextMenuElement({
            point: {x: 120, y: 80},
            lngLat: {lat: 40, lng: -75},
            line: null,
            track: null,
            geometry,
        })

        assert.equal(element.geometry?.id, geometry.id)
        assert.equal(element.geometry?.type, GEOMETRY_SHAPE_TYPES.CIRCLE)
        assert.equal(element.x, 120)
        assert.equal(element.y, 80)
    })

    it('defaults missing track and geometry to null', () => {
        const element = createMapContextMenuElement({
            point: {x: 10, y: 20},
            lngLat: {lat: 0, lng: 0},
            line: null,
        })

        assert.equal(element.track, null)
        assert.equal(element.geometry, null)
    })
})
