import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {filterDetectionsByBounds, getSensorScanAircraft} from '../../app/simulation/mapViewportUtils.js'
import {refreshTrackStaleAndDecorrelation} from '../../app/simulation/trackDecorrelation.js'
import {processViewportOffDisplayTrackDropping} from '../../app/simulation/trackViewportLifecycle.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'

describe('viewport track persistence', () => {
    it('always scans the global fleet regardless of viewport dropping setting', () => {
        const globalAircraft = [{id: 'FLT-1'}, {id: 'FLT-2'}]
        const flightWorld = {
            getAllAircraft: () => globalAircraft,
            getAircraftInBounds: () => [],
        }

        assert.deepEqual(getSensorScanAircraft(flightWorld), globalAircraft)
    })

    it('preserves off-viewport firm tracks when viewport dropping is disabled', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack({
            id: 'TRK-persist',
            trackId: 'TRK-persist',
            truthAircraftId: 'FLT-1',
            longitude: -100,
            latitude: 40,
            heading: 90,
            speed: 400,
            altitude: 30000,
            lastSensorUpdateAt: 0,
            correlated: true,
            correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
            iffMode3Code: '4231',
            iffMode3UpdatedAt: 0,
            source: 'auto',
        })

        const flightWorld = {
            getAircraftById(id) {
                return id === 'FLT-1'
                    ? {id: 'FLT-1', longitude: -100, latitude: 40}
                    : null
            },
        }

        refreshTrackStaleAndDecorrelation(
            trackStore,
            9000,
            {
                radarRefreshMs: 4000,
                iffRefreshMs: 1000,
                viewportBasedTrackDroppingEnabled: false,
            },
            flightWorld,
        )

        const track = trackStore.getTrack('TRK-persist')

        assert.ok(track)
        assert.equal(track.stale, false)
        assert.equal(track.correlated, true)
    })

    it('does not sustain off-viewport tracks via truth proximity when viewport dropping is enabled', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack({
            id: 'TRK-drop',
            trackId: 'TRK-drop',
            truthAircraftId: 'FLT-1',
            longitude: -100,
            latitude: 40,
            heading: 90,
            speed: 400,
            altitude: 30000,
            lastSensorUpdateAt: 0,
            correlated: true,
            correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
            iffMode3Code: '4231',
            iffMode3UpdatedAt: 0,
            source: 'auto',
        })

        const flightWorld = {
            getAircraftById(id) {
                return id === 'FLT-1'
                    ? {id: 'FLT-1', longitude: -100, latitude: 40}
                    : null
            },
        }

        refreshTrackStaleAndDecorrelation(
            trackStore,
            9000,
            {
                radarRefreshMs: 4000,
                iffRefreshMs: 1000,
                viewportBasedTrackDroppingEnabled: true,
            },
            flightWorld,
        )

        const track = trackStore.getTrack('TRK-drop')

        assert.equal(track.stale, true)
        assert.equal(track.correlated, false)
    })

    it('limits initiation detections to display bounds', () => {
        const detections = [
            {id: 'inside', longitude: -85, latitude: 40},
            {id: 'outside', longitude: -100, latitude: 40},
        ]
        const displayBounds = {
            west: -90,
            south: 35,
            east: -80,
            north: 45,
        }

        assert.deepEqual(
            filterDetectionsByBounds(detections, displayBounds).map((detection) => detection.id),
            ['inside'],
        )
    })

    it('drops firm tracks outside the viewport when viewport dropping is enabled', () => {
        const trackStore = new TrackStore()
        const displayBounds = {
            west: -90,
            south: 35,
            east: -80,
            north: 45,
        }

        trackStore.addTrack({
            id: 'TRK-offscreen',
            trackId: 'TRK-offscreen',
            longitude: -120,
            latitude: 10,
            heading: 90,
            speed: 400,
            altitude: 30000,
            source: 'auto',
            correlated: true,
            lastSensorUpdateAt: Date.now(),
        })

        const removed = processViewportOffDisplayTrackDropping(
            trackStore,
            displayBounds,
            {viewportBasedTrackDroppingEnabled: true},
        )

        assert.deepEqual(removed, ['TRK-offscreen'])
        assert.equal(trackStore.getTrack('TRK-offscreen'), null)
    })
})
