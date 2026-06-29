import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    getNationalityFromAirportIcao,
    resolveAutoTrackNationalityFromAircraft,
} from '../../app/tools/milstd2525/airportIcaoNationality.js'

describe('airportIcaoNationality', () => {
    it('maps airport ICAO codes from the simulator catalog to nationality codes', () => {
        assert.equal(getNationalityFromAirportIcao('KJFK'), 'US')
        assert.equal(getNationalityFromAirportIcao('EGLL'), 'GB')
        assert.equal(getNationalityFromAirportIcao('LFPG'), 'FR')
        assert.equal(getNationalityFromAirportIcao('VHHH'), 'HK')
        assert.equal(getNationalityFromAirportIcao('RJTT'), 'JP')
        assert.equal(getNationalityFromAirportIcao('CYYZ'), 'CA')
        assert.equal(getNationalityFromAirportIcao('SBGR'), 'BR')
    })

    it('picks origin or destination nationality for commercial aircraft', () => {
        assert.equal(
            resolveAutoTrackNationalityFromAircraft({
                origin: 'KJFK',
                destination: 'EGLL',
            }, () => 0),
            'US',
        )
        assert.equal(
            resolveAutoTrackNationalityFromAircraft({
                origin: 'KJFK',
                destination: 'EGLL',
            }, () => 0.99),
            'GB',
        )
    })

    it('uses the home airport for general aviation aircraft', () => {
        assert.equal(
            resolveAutoTrackNationalityFromAircraft({
                homeAirportIcao: 'EDDM',
            }),
            'DE',
        )
    })

    it('returns unspecified when no airport nationality can be resolved', () => {
        assert.equal(resolveAutoTrackNationalityFromAircraft(null), '')
        assert.equal(resolveAutoTrackNationalityFromAircraft({}), '')
    })
})
