import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    getGeometryDisplayTitle,
    getGeometryLabelPoint,
} from '../../app/tools/map/drawGeometry/drawGeometryGeometry.js'
import {createGeometryShape} from '../../app/tools/map/drawGeometry/drawGeometryModels.js'
import {
    GEOMETRY_SHAPE_TYPES,
    GEOMETRY_STATUS,
} from '../../app/tools/map/drawGeometry/drawGeometryTypes.js'
import {
    roundGeometryDrawOffsetNm,
    roundGeometryManualOffsetNm,
    roundDrawGeometryParams,
    roundManualGeometryParams,
} from '../../app/tools/map/drawGeometry/drawGeometryRounding.js'

describe('draw geometry rounding', () => {
    it('rounds draw offsets to whole numbers', () => {
        assert.equal(roundGeometryDrawOffsetNm(12.6), 13)
        assert.equal(roundDrawGeometryParams({halfWidthNm: 4.4, halfHeightNm: 2.2}).halfWidthNm, 4)
    })

    it('rounds manual offsets to two decimal places', () => {
        assert.equal(roundGeometryManualOffsetNm(12.678), 12.68)
        assert.equal(roundManualGeometryParams({radiusNm: 3.456}).radiusNm, 3.46)
    })
})

describe('draw geometry labels', () => {
    it('anchors labels on the northern edge of the shape', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.RECTANGLE)
        shape.params = {
            center: {lat: 40, lng: -75},
            halfWidthNm: 10,
            halfHeightNm: 5,
        }
        shape.status = GEOMETRY_STATUS.COMMITTED

        const labelPoint = getGeometryLabelPoint(shape)

        assert.ok(labelPoint.lat > shape.params.center.lat)
        assert.equal(labelPoint.lng, shape.params.center.lng)
    })

    it('falls back to the shape type label when name is empty', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.CIRCLE)

        assert.equal(getGeometryDisplayTitle(shape), 'Circle')
    })
})
