import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {getRacetrackAxisLinePreview} from '../../app/tools/map/drawGeometry/drawGeometryRacetrackPreview.js'
import {createGeometryShape} from '../../app/tools/map/drawGeometry/drawGeometryModels.js'
import {GEOMETRY_SHAPE_TYPES, GEOMETRY_STATUS} from '../../app/tools/map/drawGeometry/drawGeometryTypes.js'

describe('racetrack axis line preview', () => {
    it('shows a line from the first origin to the cursor during step one', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.RACETRACK)
        shape.params.center1 = {lat: 40, lng: -80}

        const preview = getRacetrackAxisLinePreview({
            shape,
            phase: 1,
            cursorPoint: {lat: 41, lng: -78},
        })

        assert.deepEqual(preview, {
            from: {lat: 40, lng: -80},
            to: {lat: 41, lng: -78},
        })
    })

    it('shows a fixed line between both origins during step two', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.RACETRACK)
        shape.params.center1 = {lat: 40, lng: -80}
        shape.params.center2 = {lat: 41, lng: -78}

        const preview = getRacetrackAxisLinePreview({
            shape,
            phase: 2,
            cursorPoint: {lat: 42, lng: -77},
        })

        assert.deepEqual(preview, {
            from: {lat: 40, lng: -80},
            to: {lat: 41, lng: -78},
        })
    })

    it('hides the construction line after the racetrack is committed', () => {
        const shape = createGeometryShape(GEOMETRY_SHAPE_TYPES.RACETRACK)
        shape.status = GEOMETRY_STATUS.COMMITTED
        shape.params = {
            center1: {lat: 40, lng: -80},
            center2: {lat: 41, lng: -78},
            radiusNm: 5,
        }

        assert.equal(
            getRacetrackAxisLinePreview({
                shape,
                phase: 2,
                cursorPoint: {lat: 42, lng: -77},
            }),
            null,
        )
    })
})
