import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {
    isTrackInsideDisplayBounds,
    processViewportOffDisplayTrackDropping,
} from '../../app/simulation/trackViewportLifecycle.js'

const displayBounds = {
    west: -90,
    south: 35,
    east: -80,
    north: 45,
}

function createAutoTrack(overrides = {}) {
    return {
        id: 'TRK-auto',
        trackId: 'TRK-auto',
        longitude: -100,
        latitude: 40,
        heading: 90,
        speed: 400,
        altitude: 30000,
        source: 'auto',
        correlated: true,
        ...overrides,
    }
}

describe('trackViewportLifecycle', () => {
    it('detects tracks inside and outside display bounds', () => {
        assert.equal(
            isTrackInsideDisplayBounds(createAutoTrack({longitude: -85, latitude: 40}), displayBounds),
            true,
        )
        assert.equal(
            isTrackInsideDisplayBounds(createAutoTrack({longitude: -100, latitude: 40}), displayBounds),
            false,
        )
    })

    it('drops auto tracks outside display bounds when viewport dropping is enabled', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createAutoTrack())
        trackStore.addTrack(createAutoTrack({
            id: 'TRK-inside',
            trackId: 'TRK-inside',
            longitude: -85,
            latitude: 40,
        }))

        const removed = processViewportOffDisplayTrackDropping(
            trackStore,
            displayBounds,
            {viewportBasedTrackDroppingEnabled: true},
        )

        assert.deepEqual(removed, ['TRK-auto'])
        assert.equal(trackStore.getTrack('TRK-auto'), null)
        assert.ok(trackStore.getTrack('TRK-inside'))
    })

    it('does not drop protected or manual tracks outside display bounds', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createAutoTrack({dropProtect: true}))
        trackStore.upsertManualTrack({
            id: 'TRK-manual',
            trackId: 'TRK-manual',
            longitude: -100,
            latitude: 40,
            heading: 0,
            speed: 0,
            source: 'manual',
        })

        const removed = processViewportOffDisplayTrackDropping(
            trackStore,
            displayBounds,
            {viewportBasedTrackDroppingEnabled: true},
        )

        assert.deepEqual(removed, [])
        assert.ok(trackStore.getTrack('TRK-auto'))
        assert.ok(trackStore.getTrack('TRK-manual'))
    })

    it('does nothing when viewport dropping is disabled', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createAutoTrack())

        const removed = processViewportOffDisplayTrackDropping(
            trackStore,
            displayBounds,
            {viewportBasedTrackDroppingEnabled: false},
        )

        assert.deepEqual(removed, [])
        assert.ok(trackStore.getTrack('TRK-auto'))
    })
})
