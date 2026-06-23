import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    createTrackFromManagementWindow,
    createTrackUpdateFromManagementWindow,
} from '../../app/tools/map/trackManagementTrack.js'

function managementWindow(overrides = {}) {
    return {
        trackId: 'AUTO-1',
        lngLat: {
            lng: -75,
            lat: 40,
        },
        domain: 'AIR',
        identity: 'NEUTRAL',
        type: '01:110104',
        specificType: 'F-16',
        heading: 45,
        speed: 420,
        altitude: 12_000,
        infoFields: false,
        callsign: 'CIV01',
        correlationMode: 'active',
        source: 'auto',
        ...overrides,
    }
}

function existingTrack(overrides = {}) {
    return {
        id: 'AUTO-1',
        trackId: 'AUTO-1',
        longitude: -76,
        latitude: 41,
        domain: 'AIR',
        identity: 'NEUTRAL',
        type: '01:110104',
        specificType: 'F-16',
        heading: 120,
        speed: 470,
        altitude: 13_000,
        infoFields: false,
        callsign: 'CIV01',
        correlationMode: 'active',
        source: 'auto',
        correlated: true,
        lastSensorUpdateAt: 10_000,
        ...overrides,
    }
}

describe('track management track updates', () => {
    it('creates manual tracks from management window kinematics', () => {
        assert.deepEqual(createTrackFromManagementWindow(managementWindow({
            trackId: 'MAN-1',
            heading: 370,
            speed: '',
            altitude: '35,000',
            callsign: '',
            source: 'manual',
        })), {
            id: 'MAN-1',
            trackId: 'MAN-1',
            longitude: -75,
            latitude: 40,
            domain: 'AIR',
            identity: 'NEUTRAL',
            type: '01:110104',
            specificType: 'F-16',
            heading: 10,
            speed: null,
            altitude: 35_000,
            infoFields: false,
            callsign: 'MAN-1',
            correlationMode: 'active',
            source: 'manual',
        })
    })

    it('preserves live kinematics when only metadata changes', () => {
        const updated = createTrackUpdateFromManagementWindow(
            managementWindow({
                callsign: 'VIP01',
                heading: 45,
                speed: 420,
                altitude: 12_000,
            }),
            existingTrack({
                heading: 120,
                speed: 470,
                altitude: 13_000,
            }),
            ['callsign'],
        )

        assert.equal(updated.callsign, 'VIP01')
        assert.equal(updated.longitude, -76)
        assert.equal(updated.latitude, 41)
        assert.equal(updated.heading, 120)
        assert.equal(updated.speed, 470)
        assert.equal(updated.altitude, 13_000)
        assert.equal(updated.source, 'manual')
        assert.equal(updated.userDirected, true)
    })

    it('updates only the committed kinematic fields', () => {
        const updated = createTrackUpdateFromManagementWindow(
            managementWindow({
                heading: '090',
                speed: 420,
                altitude: 12_000,
            }),
            existingTrack({
                heading: 120,
                speed: 470,
                altitude: 13_000,
            }),
            ['heading'],
        )

        assert.equal(updated.heading, 90)
        assert.equal(updated.speed, 470)
        assert.equal(updated.altitude, 13_000)
    })
})
