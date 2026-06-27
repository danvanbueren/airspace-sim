import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {isPointInBounds} from '../../app/simulation/geo.js'
import {filterTracksByBounds} from '../../app/tools/map/mapViewportUtils.js'

describe('wrapped map bounds', () => {
    it('matches points inside world-copy longitude bounds', () => {
        const bounds = {
            west: 160,
            south: 20,
            east: 200,
            north: 60,
        }

        assert.equal(isPointInBounds(-170, 40, bounds), true)
        assert.equal(isPointInBounds(190, 40, bounds), true)
        assert.equal(isPointInBounds(150, 40, bounds), false)
        assert.equal(isPointInBounds(-170, 40, {
            ...bounds,
            west: 520,
            east: 560,
        }), true)
        assert.equal(isPointInBounds(-175, 40, {
            ...bounds,
            west: 170,
            east: -170,
        }), true)
        assert.equal(isPointInBounds(-175, 40, {
            ...bounds,
            west: 530,
            east: 550,
        }), true)
    })

    it('filters tracks using the same wrapped longitude handling as scan bounds', () => {
        const tracks = [
            {
                id: 'pacific-track',
                longitude: -170,
                latitude: 40,
            },
            {
                id: 'outside-track',
                longitude: 150,
                latitude: 40,
            },
            {
                id: 'outside-latitude-track',
                longitude: -170,
                latitude: 70,
            },
        ]

        assert.deepEqual(
            filterTracksByBounds(tracks, {
                west: 160,
                south: 20,
                east: 200,
                north: 60,
            }).map((track) => track.id),
            ['pacific-track'],
        )
    })
})
