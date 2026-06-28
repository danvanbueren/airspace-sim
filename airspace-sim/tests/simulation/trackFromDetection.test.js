import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {trackFromInitiation} from '../../app/simulation/trackFromDetection.js'
import {
    TRACK_IDENTITIES,
    TRACK_TYPES,
} from '../../app/tools/milstd2525/trackSymbolCodes.js'

describe('trackFromInitiation', () => {
    it('always starts auto tracks as pending with an unspecified air type', () => {
        const track = trackFromInitiation({
            plotId: 'plot-1',
            sensorType: 'radar',
            longitude: -75,
            latitude: 40,
            timestamp: 1000,
            flightWorld: {
                findNearestAircraft: () => ({
                    domain: 'air',
                    identity: 'neutral',
                    type: TRACK_TYPES.FIGHTER,
                    heading: 180,
                    speed: 450,
                    altitude: 35_000,
                    id: 'UAL123',
                }),
            },
        })

        assert.equal(track.identity, TRACK_IDENTITIES.PENDING)
        assert.equal(track.type, TRACK_TYPES.AIR_UNSPECIFIED)
        assert.equal(track.specificType, '')
        assert.equal(track.identityPendingSinceAt, 1000)
    })
})
