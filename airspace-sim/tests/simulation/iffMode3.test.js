import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    assignMode3Code,
    buildIffEmergencyAlarmMessage,
    formatMode3Code,
    getEmergencyAlertSignalId,
    getEmergencyAttentionFlagId,
    getEmergencySquawkLabel,
    isEmergencyMode3Code,
    isIffMode3Stale,
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

    it('derives stale IFF attention when refresh ages out', () => {
        const track = {
            iffMode3Code: '4231',
            iffMode3UpdatedAt: 1_000,
        }

        assert.ok(!isIffMode3Stale(track, 2_000, 1000))
        assert.ok(isIffMode3Stale(track, 5_000, 1000))

        const flags = deriveAttentionFlagsFromTrackState(track, 5_000, 1000)

        assert.ok(flags.includes('IFF_STALE'))
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

    it('updates track IFF fields from correlated detections', () => {
        const trackStore = new TrackStore()
        trackStore.addTrack(activeTrack({id: 'TRK-1'}))

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
