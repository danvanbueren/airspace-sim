import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    assignMode3Code,
    buildIffEmergencyAlarmKey,
    buildIffEmergencyAlarmMessage,
    EMERGENCY_ALARM_DEDUP_GRACE_MS,
    formatMode3Code,
    getEmergencyAlertSignalId,
    getEmergencyAttentionFlagId,
    getEmergencySquawkLabel,
    isEmergencyMode3Code,
    isIffMode3Stale,
    isSharedVfrMode3Code,
    isValidMode3Code,
    maintainFleetEmergencySquawks,
    MODE3_CODE_VFR_EU,
    MODE3_CODE_VFR_US,
} from '../../app/simulation/iffMode3.js'
import {
    applyIffCorrelationFields,
    clearSeparatedIffTrackCodes,
    correlateIffDetections,
} from '../../app/simulation/iffCorrelation.js'
import {pickIffMergeSource} from '../../app/simulation/trackMerge.js'
import {TrackStore} from '../../app/simulation/TrackStore.js'
import {TRACK_CORRELATION_MODES} from '../../app/simulation/trackFromDetection.js'
import {deriveAttentionFlagsFromTrackState} from '../../app/simulation/trackAttentionFlags.js'
import {
    advanceGeneralAviationAircraft,
    createGeneralAviationAircraft,
    getGeneralAviationFleetSize,
} from '../../app/simulation/generalAviationTraffic.js'
import {SENSOR_TYPES} from '../../app/simulation/constants.js'

function activeTrack(overrides = {}) {
    return {
        id: overrides.id ?? 'TRK-1',
        trackId: overrides.id ?? 'TRK-1',
        latitude: overrides.latitude ?? 40,
        longitude: overrides.longitude ?? -75,
        heading: 90,
        speed: 400,
        altitude: 30000,
        lastSensorUpdateAt: 1_000,
        lastExtrapolationAt: 1_000,
        stale: false,
        domain: 'air',
        type: '01:110104',
        callsign: overrides.id ?? 'TRK-1',
        correlationMode: TRACK_CORRELATION_MODES.ACTIVE,
        correlated: false,
        ...overrides,
    }
}

describe('iffMode3', () => {
    it('formats and validates octal Mode 3 codes', () => {
        assert.equal(formatMode3Code('231'), '0231')
        assert.ok(isValidMode3Code('4231'))
        assert.ok(!isValidMode3Code('4238'))
    })

    it('assigns VFR codes for general aviation traffic', () => {
        const usRandom = () => 0.5
        const euRandom = () => 0.5

        assert.equal(assignMode3Code(usRandom, {vfr: true, useEuropeanVfr: false}), MODE3_CODE_VFR_US)
        assert.equal(assignMode3Code(euRandom, {vfr: true, useEuropeanVfr: true}), MODE3_CODE_VFR_EU)
    })

    it('maps emergency codes to attention and alert signal ids', () => {
        assert.equal(getEmergencyAttentionFlagId('7700'), 'IFF_EMER')
        assert.equal(getEmergencyAttentionFlagId('7600'), 'IFF_NORDO')
        assert.equal(getEmergencyAttentionFlagId('7500'), 'IFF_HIJ')
        assert.equal(getEmergencyAlertSignalId('7700'), 'IFF_EMER_ALERT')
        assert.ok(isEmergencyMode3Code('7500'))
        assert.ok(!isEmergencyMode3Code('1200'))
    })

    it('builds concise emergency alarm messages', () => {
        const track = activeTrack({callsign: 'UAL123', id: 'TRK-1'})

        assert.equal(getEmergencySquawkLabel('7700'), 'EMERGENCY')
        assert.equal(getEmergencySquawkLabel('7600'), 'NORDO')
        assert.equal(getEmergencySquawkLabel('7500'), 'HIJACK')
        assert.equal(buildIffEmergencyAlarmMessage(track, '7700'), 'Track (UAL123) squawking EMERGENCY')
        assert.equal(buildIffEmergencyAlarmMessage(track, '7600'), 'Track (UAL123) squawking NORDO')
        assert.equal(buildIffEmergencyAlarmMessage(track, '7500'), 'Track (UAL123) squawking HIJACK')
    })

    it('builds stable emergency alarm dedup keys', () => {
        const assignedCallsignTrack = activeTrack({callsign: 'UAL123', id: 'TRK-1'})

        assert.equal(buildIffEmergencyAlarmKey(assignedCallsignTrack, '7700'), '7700:UAL123')
        assert.equal(
            buildIffEmergencyAlarmKey(activeTrack({callsign: 'TRK-1', id: 'TRK-1'}), '7700'),
            '7700:TRK-1',
        )
        assert.equal(
            buildIffEmergencyAlarmKey(activeTrack({callsign: 'CIV01', id: 'TRK-2'}), '7500'),
            '7500:TRK-2',
        )
        assert.equal(
            buildIffEmergencyAlarmKey(activeTrack({id: 'TRK-3', callsign: undefined}), '7600'),
            '7600:TRK-3',
        )
    })

    it('defines a five-minute grace period before clearing inactive emergency dedup keys', () => {
        assert.equal(EMERGENCY_ALARM_DEDUP_GRACE_MS, 300_000)
    })

    it('derives stale IFF attention when refresh ages out', () => {
        const track = {
            iffMode3Code: '4231',
            iffMode3UpdatedAt: 1_000,
            correlated: true,
        }

        assert.ok(!isIffMode3Stale(track, 2_000, 1000))
        assert.ok(isIffMode3Stale(track, 5_000, 1000))

        const flags = deriveAttentionFlagsFromTrackState(track, 5_000, 1000)

        assert.ok(flags.includes('IFF_STALE'))
    })

    it('suppresses emergency attention flags when IFF data is stale', () => {
        const track = {
            iffMode3Code: '7700',
            iffMode3UpdatedAt: 1_000,
            correlated: true,
        }

        const flags = deriveAttentionFlagsFromTrackState(track, 5_000, 1000)

        assert.ok(!flags.includes('IFF_EMER'))
        assert.ok(flags.includes('IFF_STALE'))
    })

    it('identifies shared VFR squawk codes', () => {
        assert.ok(isSharedVfrMode3Code(MODE3_CODE_VFR_US))
        assert.ok(isSharedVfrMode3Code(MODE3_CODE_VFR_EU))
        assert.ok(!isSharedVfrMode3Code('4231'))
    })

    it('maintains between one and three fleet emergency squawks', () => {
        const fleet = Array.from({length: 20}, (_, index) => ({
            id: `FLT-${index}`,
            mode3Code: '1200',
        }))

        const {nextCount, targetCount} = maintainFleetEmergencySquawks(fleet, () => 0.5)

        assert.ok(targetCount >= 1)
        assert.ok(targetCount <= 3)
        assert.equal(nextCount, targetCount)
        assert.equal(
            fleet.filter((aircraft) => isEmergencyMode3Code(aircraft.mode3Code)).length,
            targetCount,
        )
    })

    it('never assigns emergency codes during normal Mode 3 assignment', () => {
        for (let index = 0; index < 50; index += 1) {
            const code = assignMode3Code(Math.random)

            assert.ok(!isEmergencyMode3Code(code))
        }
    })
})

describe('iffCorrelation', () => {
    it('prefers re-binding tracks to their stored Mode 3 code', () => {
        const detections = [
            {
                id: 'iff-1',
                sensorType: SENSOR_TYPES.IFF,
                mode3Code: '1111',
                latitude: 40,
                longitude: -75,
            },
            {
                id: 'iff-2',
                sensorType: SENSOR_TYPES.IFF,
                mode3Code: '2222',
                latitude: 40.001,
                longitude: -75,
            },
        ]

        const tracks = [
            activeTrack({id: 'TRK-A', latitude: 40.001, iffMode3Code: '1111'}),
            activeTrack({id: 'TRK-B', latitude: 40}),
        ]

        const correlated = correlateIffDetections(detections, tracks, 5)

        assert.equal(correlated[0].correlatedTrackId, 'TRK-A')
        assert.equal(correlated[1].correlatedTrackId, 'TRK-B')
    })

    it('clears stored codes when the track separates from matching returns', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-1',
            latitude: 40,
            iffMode3Code: '4231',
            iffMode3UpdatedAt: 1_000,
        }))

        const cleared = clearSeparatedIffTrackCodes(trackStore, [
            {
                id: 'iff-far',
                mode3Code: '4231',
                latitude: 41,
                longitude: -75,
            },
        ], 5)

        assert.deepEqual(cleared, ['TRK-1'])
        assert.equal(trackStore.getTrack('TRK-1').iffMode3Code, null)
    })

    it('does not clear stored codes when matching returns drop out of the scan', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-1',
            latitude: 40,
            iffMode3Code: '4231',
            iffMode3UpdatedAt: 1_000,
        }))

        const cleared = clearSeparatedIffTrackCodes(trackStore, [], 5)

        assert.deepEqual(cleared, [])
        assert.equal(trackStore.getTrack('TRK-1').iffMode3Code, '4231')
    })

    it('prefers nearest track for general IFF matching after code bindings', () => {
        const detections = [
            {
                id: 'iff-1',
                sensorType: SENSOR_TYPES.IFF,
                mode3Code: '3333',
                latitude: 40,
                longitude: -75,
            },
        ]

        const tracks = [
            activeTrack({id: 'TRK-NEAR', latitude: 40.001}),
            activeTrack({id: 'TRK-FAR', latitude: 40.01}),
        ]

        const correlated = correlateIffDetections(detections, tracks, 5)

        assert.equal(correlated[0].correlatedTrackId, 'TRK-NEAR')
    })

    it('does not overwrite stored Mode 3 codes through general IFF matching', () => {
        const detections = [
            {
                id: 'iff-emer',
                sensorType: SENSOR_TYPES.IFF,
                mode3Code: '7700',
                latitude: 40,
                longitude: -75,
            },
        ]

        const tracks = [
            activeTrack({id: 'TRK-STORED', latitude: 40, iffMode3Code: '1200'}),
            activeTrack({id: 'TRK-EMPTY', latitude: 40.001}),
        ]

        const correlated = correlateIffDetections(detections, tracks, 5)

        assert.equal(correlated[0].correlatedTrackId, 'TRK-EMPTY')
    })

    it('uses proximity instead of code binding for shared VFR squawks', () => {
        const detections = [
            {
                id: 'iff-vfr',
                sensorType: SENSOR_TYPES.IFF,
                mode3Code: MODE3_CODE_VFR_US,
                latitude: 40,
                longitude: -75,
            },
        ]

        const tracks = [
            activeTrack({id: 'TRK-NEAR', latitude: 40.001, iffMode3Code: MODE3_CODE_VFR_US}),
            activeTrack({id: 'TRK-FAR', latitude: 40.01, iffMode3Code: MODE3_CODE_VFR_US}),
        ]

        const correlated = correlateIffDetections(detections, tracks, 5)

        assert.equal(correlated[0].correlatedTrackId, 'TRK-NEAR')
    })

    it('does not clear stored codes correlated on the same scan', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-1',
            latitude: 40,
            iffMode3Code: '4231',
            iffMode3UpdatedAt: 1_000,
        }))

        const detections = [
            {
                id: 'iff-near',
                mode3Code: '4231',
                latitude: 41,
                longitude: -75,
                correlated: true,
                correlatedTrackId: 'TRK-1',
            },
        ]

        const cleared = clearSeparatedIffTrackCodes(trackStore, detections, 5, {
            correlatedDetections: detections,
            timestamp: 2_000,
        })

        assert.deepEqual(cleared, [])
        assert.equal(trackStore.getTrack('TRK-1').iffMode3Code, '4231')
    })

    it('does not apply mismatched non-emergency squawks to stored tracks', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({
            id: 'TRK-1',
            iffMode3Code: '1200',
            iffMode3UpdatedAt: 1_000,
        }))

        applyIffCorrelationFields(trackStore, [
            {
                correlated: true,
                correlatedTrackId: 'TRK-1',
                mode3Code: '3333',
            },
        ], 2_000)

        assert.equal(trackStore.getTrack('TRK-1').iffMode3Code, '1200')
    })

    it('prefers emergency squawks when merging tracks', () => {
        const survivor = activeTrack({
            id: 'TRK-A',
            iffMode3Code: '1200',
            iffMode3UpdatedAt: 5_000,
        })
        const merged = activeTrack({
            id: 'TRK-B',
            iffMode3Code: '7700',
            iffMode3UpdatedAt: 2_000,
        })

        const iffSource = pickIffMergeSource(survivor, merged)

        assert.equal(iffSource.iffMode3Code, '7700')
    })

    it('updates track IFF fields from correlated detections', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({id: 'TRK-1', correlated: true}))

        applyIffCorrelationFields(trackStore, [
            {
                correlated: true,
                correlatedTrackId: 'TRK-1',
                mode3Code: '7700',
            },
        ], 2_000)

        const track = trackStore.getTrack('TRK-1')

        assert.equal(track.iffMode3Code, '7700')
        assert.equal(track.iffMode3UpdatedAt, 2_000)

        const flags = deriveAttentionFlagsFromTrackState(track, 2_000, 1000)

        assert.ok(flags.includes('IFF_EMER'))
    })
})

describe('generalAviationTraffic', () => {
    it('creates slow low-altitude aircraft near an airport', () => {
        const aircraft = createGeneralAviationAircraft('GA-1', {
            icao: 'KJFK',
            lng: -73.7781,
            lat: 40.6413,
        }, () => 0.25)

        assert.equal(aircraft.trafficKind, 'generalAviation')
        assert.ok(aircraft.altitude <= 3500)
        assert.ok(aircraft.speed <= 120)
        assert.equal(aircraft.mode3Code, MODE3_CODE_VFR_US)
    })

    it('advances aircraft along a local orbit', () => {
        const aircraft = createGeneralAviationAircraft('GA-1', {
            icao: 'EGLL',
            lng: -0.4614,
            lat: 51.47,
        }, () => 0.5)

        const next = advanceGeneralAviationAircraft(aircraft, 10)

        assert.notEqual(next.longitude, aircraft.longitude)
        assert.notEqual(next.latitude, aircraft.latitude)
        assert.equal(next.mode3Code, aircraft.mode3Code)
    })

    it('reserves a small GA fleet slice', () => {
        assert.equal(getGeneralAviationFleetSize(1000), 40)
        assert.equal(getGeneralAviationFleetSize(100), 4)
    })
})
