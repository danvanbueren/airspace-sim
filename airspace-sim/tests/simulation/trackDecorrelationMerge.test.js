import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {CorrelationService} from '../../app/simulation/CorrelationService.js'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {SENSOR_TYPES} from '../../app/simulation/constants.js'
import {mergeTracksFromCorrelatedDetections} from '../../app/simulation/trackMerge.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'
import {refreshTrackStaleAndDecorrelation} from '../../app/simulation/trackDecorrelation.js'
import {TRACK_IDENTITIES} from '../../app/tools/milstd2525/trackSymbolCodes.js'

const settings = {
    radarRefreshMs: 4000,
    iffRefreshMs: 1000,
}

function activeTrack(overrides = {}) {
    return {
        id: overrides.id,
        trackId: overrides.id,
        source: overrides.source ?? 'auto',
        identity: overrides.identity ?? TRACK_IDENTITIES.PENDING,
        latitude: overrides.latitude ?? 40,
        longitude: overrides.longitude ?? -75,
        heading: overrides.heading ?? 90,
        speed: overrides.speed ?? 400,
        altitude: overrides.altitude ?? 30000,
        lastSensorUpdateAt: overrides.lastSensorUpdateAt ?? 1_000,
        lastExtrapolationAt: overrides.lastExtrapolationAt ?? 1_000,
        stale: overrides.stale ?? false,
        domain: 'air',
        type: '01:110104',
        callsign: overrides.callsign ?? overrides.id,
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        correlated: overrides.correlated ?? true,
        userDirected: overrides.userDirected ?? false,
    }
}

function runScanPipeline(trackStore, detections, timestamp, sensorType = SENSOR_TYPES.RADAR) {
    const correlation = new CorrelationService()
    const correlatedDetections = correlation.apply(
        detections,
        trackStore,
        5,
        timestamp,
        sensorType,
    )

    mergeTracksFromCorrelatedDetections(
        trackStore,
        correlatedDetections,
        3,
        timestamp,
    )

    return correlatedDetections
}

describe('decorrelation and merge robustness', () => {
    it('re-correlates a stale decorrelated track when sensor data returns', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-radar-plot-1',
            lastSensorUpdateAt: 0,
        }))

        refreshTrackStaleAndDecorrelation(trackStore, 9000, settings)

        const staleTrack = trackStore.getTrack('TRK-radar-plot-1')

        assert.equal(staleTrack.stale, true)
        assert.equal(staleTrack.correlated, false)

        runScanPipeline(trackStore, [{
            plotId: 'PLOT-1',
            latitude: 40,
            longitude: -75,
        }], 10_000)

        const reCorrelated = trackStore.getTrack('TRK-radar-plot-1')

        assert.equal(reCorrelated.correlated, true)
        assert.equal(reCorrelated.stale, false)
        assert.equal(reCorrelated.lastSensorUpdateAt, 10_000)
    })

    it('merges a stale decorrelated auto track into a newly correlated auto-initiated duplicate', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-radar-old',
            latitude: 40.02,
            identity: TRACK_IDENTITIES.PENDING,
            lastSensorUpdateAt: 0,
            correlated: false,
            stale: true,
        }))
        trackStore.addTrack(activeTrack({
            id: 'TRK-radar-new',
            latitude: 40,
            identity: TRACK_IDENTITIES.PENDING,
            lastSensorUpdateAt: 10_000,
            correlated: true,
        }))

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-radar-new',
            latitude: 40,
            longitude: -75,
        }], 3, 10_000)

        assert.deepEqual(mergedAwayIds, ['TRK-radar-old'])
        assert.equal(trackStore.getTrack('TRK-radar-old'), null)
        assert.equal(trackStore.getTrack('TRK-radar-new').correlated, true)
    })

    it('merges decorrelated and newly correlated auto tracks across pending and neutral identities', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-radar-stale',
            latitude: 40.015,
            identity: TRACK_IDENTITIES.NEUTRAL,
            lastSensorUpdateAt: 0,
            correlated: false,
            stale: true,
        }))
        trackStore.addTrack(activeTrack({
            id: 'TRK-iff-fresh',
            latitude: 40,
            identity: TRACK_IDENTITIES.PENDING,
            lastSensorUpdateAt: 20_000,
            correlated: true,
        }))

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-iff-fresh',
            latitude: 40,
            longitude: -75,
        }], 3, 20_000)

        assert.deepEqual(mergedAwayIds, ['TRK-radar-stale'])
        assert.equal(trackStore.getAllTracks().length, 1)
    })

    it('prefers re-correlating the existing decorrelated track when it remains nearest to the return', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-radar-original',
            latitude: 40.001,
            lastSensorUpdateAt: 0,
            correlated: false,
            stale: true,
        }))
        trackStore.addTrack(activeTrack({
            id: 'TRK-radar-duplicate',
            latitude: 40.08,
            lastSensorUpdateAt: 5_000,
            correlated: false,
            stale: false,
        }))

        const correlatedDetections = runScanPipeline(trackStore, [{
            plotId: 'PLOT-1',
            latitude: 40,
            longitude: -75,
        }], 10_000)

        assert.equal(correlatedDetections[0].correlatedTrackId, 'TRK-radar-original')
        assert.equal(trackStore.getTrack('TRK-radar-original').correlated, true)
        assert.equal(trackStore.getTrack('TRK-radar-duplicate').correlated, false)
        assert.equal(trackStore.getAllTracks().length, 2)
    })

    it('does not merge decorrelated tracks that drifted beyond the merge proximity threshold', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-radar-stale',
            latitude: 40.08,
            identity: TRACK_IDENTITIES.PENDING,
            lastSensorUpdateAt: 0,
            correlated: false,
            stale: true,
        }))
        trackStore.addTrack(activeTrack({
            id: 'TRK-radar-fresh',
            latitude: 40,
            identity: TRACK_IDENTITIES.PENDING,
            lastSensorUpdateAt: 10_000,
            correlated: true,
        }))

        const mergedAwayIds = mergeTracksFromCorrelatedDetections(trackStore, [{
            correlated: true,
            correlatedTrackId: 'TRK-radar-fresh',
            latitude: 40,
            longitude: -75,
        }], 3, 10_000)

        assert.deepEqual(mergedAwayIds, [])
        assert.equal(trackStore.getAllTracks().length, 2)
    })
})
