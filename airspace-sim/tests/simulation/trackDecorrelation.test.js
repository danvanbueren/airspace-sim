import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'
import {TRACK_KINDS} from '../../app/simulation/trackKinds.js'
import {
    AUTO_DROP_REMOVE_DELAY_MS,
    AUTO_DROP_RISK_DELAY_MS,
    processAutoDropTracks,
} from '../../app/simulation/trackAutoDrop.js'
import {
    decorrelateAllActiveTracks,
    getTrackStaleThresholdMs,
    refreshTrackStaleAndDecorrelation,
} from '../../app/simulation/trackDecorrelation.js'
import {deriveAttentionFlagsFromTrackState} from '../../app/simulation/trackAttentionFlags.js'

const settings = {
    radarRefreshMs: 4000,
    iffRefreshMs: 1000,
}

function createTrack(overrides = {}) {
    return {
        id: 'TRK-test',
        trackId: 'TRK-test',
        longitude: -77.5,
        latitude: 39.2,
        heading: 90,
        speed: 400,
        altitude: 30000,
        lastSensorUpdateAt: 0,
        lastExtrapolationAt: 0,
        stale: false,
        domain: 'air',
        identity: 'pending',
        type: '01:110104',
        callsign: 'TEST01',
        source: 'auto',
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        correlated: true,
        iffMode3Code: '4231',
        iffMode3UpdatedAt: 0,
        ...overrides,
    }
}

describe('trackDecorrelation', () => {
    it('computes stale threshold from sensor refresh settings', () => {
        assert.equal(getTrackStaleThresholdMs(settings), 8000)
    })

    it('decorrelates stale active tracks and clears stored IFF codes', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createTrack({lastSensorUpdateAt: 0}))

        const decorrelatedTrackIds = refreshTrackStaleAndDecorrelation(
            trackStore,
            9000,
            settings,
        )

        assert.deepEqual(decorrelatedTrackIds, ['TRK-test'])

        const track = trackStore.getTrack('TRK-test')

        assert.equal(track.stale, true)
        assert.equal(track.correlated, false)
        assert.equal(track.iffMode3Code, null)
        assert.equal(track.iffMode3UpdatedAt, null)
    })

    it('does not decorrelate stale active tracks while linked truth aircraft remain nearby and dropping is disabled', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createTrack({
            truthAircraftId: 'FLT-1',
            lastSensorUpdateAt: 0,
        }))
        const flightWorld = {
            getAircraftById(id) {
                return id === 'FLT-1'
                    ? {id: 'FLT-1', longitude: -77.5, latitude: 39.2}
                    : null
            },
        }

        refreshTrackStaleAndDecorrelation(trackStore, 9000, settings, flightWorld)

        const track = trackStore.getTrack('TRK-test')

        assert.equal(track.stale, false)
        assert.equal(track.correlated, true)
        assert.equal(track.iffMode3Code, '4231')
    })

    it('does not decorrelate tracks still inside the stale threshold', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createTrack({lastSensorUpdateAt: 5000}))

        refreshTrackStaleAndDecorrelation(trackStore, 9000, settings)

        const track = trackStore.getTrack('TRK-test')

        assert.equal(track.stale, false)
        assert.equal(track.correlated, true)
        assert.equal(track.iffMode3Code, '4231')
    })

    it('does not mark reference points stale when sensor updates age out', () => {
        const trackStore = new TrackStore()
        trackStore.upsertManualTrack({
            id: 'RP-test',
            trackId: 'RP-test',
            trackKind: TRACK_KINDS.REFERENCE_POINT,
            longitude: -77.5,
            latitude: 39.2,
            heading: 0,
            speed: 0,
            lastSensorUpdateAt: 0,
            correlationMode: TRACK_CORRELATION_MODES.SUSPEND,
            stale: false,
        })

        refreshTrackStaleAndDecorrelation(trackStore, 9000, settings)

        const track = trackStore.getTrack('RP-test')

        assert.equal(track.stale, false)
    })

    it('clears stale state on reference points that were previously marked stale', () => {
        const trackStore = new TrackStore()
        trackStore.upsertManualTrack({
            id: 'RP-stale',
            trackId: 'RP-stale',
            trackKind: TRACK_KINDS.REFERENCE_POINT,
            longitude: -77.5,
            latitude: 39.2,
            heading: 0,
            speed: 0,
            lastSensorUpdateAt: 0,
            correlationMode: TRACK_CORRELATION_MODES.SUSPEND,
            stale: true,
        })

        refreshTrackStaleAndDecorrelation(trackStore, 9000, settings)

        assert.equal(trackStore.getTrack('RP-stale').stale, false)
    })

    it('force-decorrelates all active correlated tracks', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createTrack({lastSensorUpdateAt: 5000}))

        decorrelateAllActiveTracks(trackStore, 5000)

        const track = trackStore.getTrack('TRK-test')

        assert.equal(track.correlated, false)
        assert.equal(track.iffMode3Code, null)
    })

    it('shows only one STALE attention after decorrelation', () => {
        const flags = deriveAttentionFlagsFromTrackState({
            stale: true,
            correlated: false,
            iffMode3Code: '4231',
            iffMode3UpdatedAt: 0,
        }, 9000, 1000)

        assert.deepEqual(flags, ['STALE'])
    })
})

describe('simulation disabled maintenance', () => {
    it('auto-drops decorrelated tracks after simulation is disabled', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(createTrack({lastSensorUpdateAt: 0}))

        decorrelateAllActiveTracks(trackStore, 1000)

        const dropStart = 1000

        processAutoDropTracks(trackStore, dropStart)
        assert.equal(trackStore.getTrack('TRK-test').dropRiskAt, dropStart)

        processAutoDropTracks(trackStore, dropStart + AUTO_DROP_RISK_DELAY_MS)
        assert.equal(trackStore.getTrack('TRK-test').dropAt, dropStart + AUTO_DROP_RISK_DELAY_MS)

        processAutoDropTracks(
            trackStore,
            dropStart + AUTO_DROP_RISK_DELAY_MS + AUTO_DROP_REMOVE_DELAY_MS,
        )
        assert.equal(trackStore.getTrack('TRK-test'), null)
    })
})
