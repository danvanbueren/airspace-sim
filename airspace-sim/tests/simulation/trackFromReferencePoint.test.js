import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    allocateNextReferencePointLabel,
    createReferencePointTrack,
    createReferencePointUpdateFromManagementWindow,
    createTrackFromReferencePointManagementWindow,
    formatReferencePointLabel,
    getUsedReferencePointNumbers,
} from '../../app/simulation/trackFromReferencePoint.js'
import {TRACK_KINDS} from '../../app/simulation/trackKinds.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'
import {
    REFERENCE_POINT_SYMBOL_CODE,
    TRACK_IDENTITIES,
} from '../../app/tools/milstd2525/trackSymbolCodes.js'

describe('trackFromReferencePoint', () => {
    it('formats reference point labels with zero padding', () => {
        assert.equal(formatReferencePointLabel(1), 'RP01')
        assert.equal(formatReferencePointLabel(12), 'RP12')
    })

    it('collects used reference point label numbers', () => {
        const tracks = [
            {trackKind: TRACK_KINDS.REFERENCE_POINT, trackId: 'RP-1', callsign: 'RP01'},
            {trackKind: TRACK_KINDS.REFERENCE_POINT, trackId: 'RP-2', callsign: 'RP03'},
            {trackKind: TRACK_KINDS.TRACK, trackId: 'TRK-1', callsign: 'RP04'},
        ]

        assert.deepEqual(getUsedReferencePointNumbers(tracks), new Set([1, 3]))
    })

    it('allocates the lowest unused reference point label', () => {
        const tracks = [
            {trackKind: TRACK_KINDS.REFERENCE_POINT, trackId: 'RP-1', callsign: 'RP01'},
            {trackKind: TRACK_KINDS.REFERENCE_POINT, trackId: 'RP-2', callsign: 'RP03'},
        ]

        assert.equal(allocateNextReferencePointLabel(tracks), 'RP02')
    })

    it('creates a suspended manual reference point at the requested position', () => {
        const track = createReferencePointTrack({
            longitude: -77.03,
            latitude: 38.89,
            existingTracks: [],
            timestamp: 5000,
            trackId: 'RP-TEST01',
        })

        assert.equal(track.trackId, 'RP-TEST01')
        assert.equal(track.trackKind, TRACK_KINDS.REFERENCE_POINT)
        assert.equal(track.longitude, -77.03)
        assert.equal(track.latitude, 38.89)
        assert.equal(track.callsign, 'RP01')
        assert.equal(track.correlationMode, TRACK_CORRELATION_MODES.SUSPEND)
        assert.equal(track.speed, 0)
        assert.equal(track.dropProtect, true)
        assert.equal(track.type, REFERENCE_POINT_SYMBOL_CODE)
        assert.equal(track.symbolCode, REFERENCE_POINT_SYMBOL_CODE)
        assert.equal(track.useFamiliarIcon, false)
        assert.equal(track.identity, TRACK_IDENTITIES.NEUTRAL)
        assert.equal(track.infoFields, false)
        assert.equal(track.lastSensorUpdateAt, 5000)
    })

    it('creates a reference point track from a management window draft', () => {
        const track = createTrackFromReferencePointManagementWindow({
            trackId: 'RP-TEST01',
            lngLat: {lng: -77.03, lat: 38.89},
            callsign: 'RP02',
            identity: TRACK_IDENTITIES.FRIENDLY,
            infoFields: true,
        }, 5000)

        assert.equal(track.callsign, 'RP02')
        assert.equal(track.identity, TRACK_IDENTITIES.FRIENDLY)
        assert.equal(track.infoFields, true)
        assert.equal(track.trackKind, TRACK_KINDS.REFERENCE_POINT)
    })

    it('preserves reference point invariants when updating from a management window', () => {
        const existingTrack = createReferencePointTrack({
            longitude: -77,
            latitude: 38,
            trackId: 'RP-EXIST01',
            callsign: 'RP01',
            timestamp: 1000,
        })

        const updatedTrack = createReferencePointUpdateFromManagementWindow({
            trackId: 'RP-EXIST01',
            lngLat: {lng: -77, lat: 38},
            callsign: 'ALPHA1',
            identity: TRACK_IDENTITIES.HOSTILE,
            infoFields: false,
        }, existingTrack, 2000)

        assert.equal(updatedTrack.callsign, 'ALPHA1')
        assert.equal(updatedTrack.identity, TRACK_IDENTITIES.HOSTILE)
        assert.equal(updatedTrack.correlationMode, TRACK_CORRELATION_MODES.SUSPEND)
        assert.equal(updatedTrack.dropProtect, true)
        assert.equal(updatedTrack.speed, 0)
        assert.equal(updatedTrack.lastUserEditAt, 2000)
    })
})
