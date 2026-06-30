import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {UniformGridIndex} from '../../app/simulation/UniformGridIndex.js'

describe('UniformGridIndex', () => {
    it('computes correct grid cell keys', () => {
        const index = new UniformGridIndex(1.0)
        assert.equal(index.getCellKey(10.5, 20.3), '10,20')
        assert.equal(index.getCellKey(-10.5, -20.3), '-11,-21')
    })

    it('inserts and retrieves objects in cells', () => {
        const index = new UniformGridIndex(1.0)
        const item1 = {id: '1', longitude: 10.5, latitude: 20.3}
        const item2 = {id: '2', longitude: 10.8, latitude: 20.9}
        const item3 = {id: '3', longitude: 12.0, latitude: 20.0}

        index.insert(item1)
        index.insert(item2)
        index.insert(item3)

        const cell = index.grid.get('10,20')
        assert.equal(cell.length, 2)
        assert.deepEqual(cell, [item1, item2])
    })

    it('clears all entries', () => {
        const index = new UniformGridIndex(1.0)
        index.insert({id: '1', longitude: 10.5, latitude: 20.3})
        index.clear()
        assert.equal(index.grid.size, 0)
    })

    it('queries candidate items within a bounding box matching the given radius', () => {
        const index = new UniformGridIndex(1.0)
        const items = [
            {id: '1', longitude: -80.0, latitude: 40.0},
            {id: '2', longitude: -80.1, latitude: 40.1},
            // Far away
            {id: '3', longitude: -70.0, latitude: 30.0},
        ]
        index.insertAll(items)

        // radius 15 NM is 0.25 degrees of latitude.
        // longitude search bounds at 40 degrees latitude:
        // cos(40) = 0.766, 15 NM = 15 / (60 * 0.766) = 0.326 degrees longitude.
        // Therefore, querying near -80.0, 40.0 should retrieve items 1 and 2, but not 3.
        const candidates = index.query(-80.0, 40.0, 15)
        const ids = candidates.map(c => c.id).sort()
        assert.deepEqual(ids, ['1', '2'])
    })

    it('safely handles queries at high latitudes near the poles', () => {
        const index = new UniformGridIndex(1.0)
        const item = {id: 'polar', longitude: 10.0, latitude: 84.9}
        index.insert(item)

        const candidates = index.query(10.0, 85.0, 15)
        assert.deepEqual(candidates, [item])
    })
})
