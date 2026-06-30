import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    FLOATING_WINDOW_CASCADE_OFFSET_PX,
    getStaggeredFloatingWindowSpawnPosition,
} from '../../app/tools/map/mapFloatingWindowLayout.js'

describe('getStaggeredFloatingWindowSpawnPosition', () => {
    it('returns the base position when no windows occupy it', () => {
        const position = getStaggeredFloatingWindowSpawnPosition([], {x: 120, y: 120})

        assert.deepEqual(position, {x: 120, y: 120})
    })

    it('offsets each additional window along the cascade diagonal', () => {
        const existingWindows = [
            {x: 120, y: 120},
            {x: 120 + FLOATING_WINDOW_CASCADE_OFFSET_PX, y: 120 + FLOATING_WINDOW_CASCADE_OFFSET_PX},
        ]

        const position = getStaggeredFloatingWindowSpawnPosition(existingWindows, {x: 120, y: 120})

        assert.deepEqual(position, {
            x: 120 + FLOATING_WINDOW_CASCADE_OFFSET_PX * 2,
            y: 120 + FLOATING_WINDOW_CASCADE_OFFSET_PX * 2,
        })
    })

    it('does not offset windows spawned at distinct map click positions', () => {
        const existingWindows = [{x: 240, y: 180}]

        const position = getStaggeredFloatingWindowSpawnPosition(existingWindows, {x: 120, y: 120})

        assert.deepEqual(position, {x: 120, y: 120})
    })
})
