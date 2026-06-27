import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {getMapFloatingWindowMaxHeight} from '../../app/tools/map/mapFloatingWindowLayout.js'
import {MAP_FLOATING_WINDOW_EDGE_PADDING} from '../../app/constants/mapFloatingWindows.js'

describe('mapFloatingWindowLayout', () => {
    it('subtracts edge padding from the container height', () => {
        assert.equal(
            getMapFloatingWindowMaxHeight(800),
            800 - MAP_FLOATING_WINDOW_EDGE_PADDING * 2,
        )
    })

    it('returns zero when the container is smaller than the padding', () => {
        assert.equal(getMapFloatingWindowMaxHeight(12), 0)
    })

    it('returns undefined for invalid container heights', () => {
        assert.equal(getMapFloatingWindowMaxHeight(0), undefined)
        assert.equal(getMapFloatingWindowMaxHeight(-10), undefined)
        assert.equal(getMapFloatingWindowMaxHeight(Number.NaN), undefined)
    })
})
