import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    formatCoordinatePairForGridReferenceSystem,
    formatPositionTextForGridReferenceSystem,
    parsePositionTextForGridReferenceSystem,
} from '../../app/tools/formatting/GridReferenceFormatting.js'

const EXAMPLE_LAT = 38.8977
const EXAMPLE_LNG = -77.0365

const GRID_SYSTEMS = {
    dd: 'dd',
    ddm: 'ddm',
    dms: 'dms',
    gars: 'gars',
    geohash: 'geohash',
    georef: 'georef',
    killbox: 'killbox',
    mgrs: 'mgrs',
}

function assertRoundTrip(gridReferenceSystem, tolerance = 0.01) {
    const formatted = formatPositionTextForGridReferenceSystem(
        EXAMPLE_LAT,
        EXAMPLE_LNG,
        gridReferenceSystem,
    )
    const parsed = parsePositionTextForGridReferenceSystem(formatted, gridReferenceSystem)

    assert.equal(parsed.error, undefined)
    assert.ok(Math.abs(parsed.lat - EXAMPLE_LAT) <= tolerance, `lat delta ${parsed.lat - EXAMPLE_LAT}`)
    assert.ok(Math.abs(parsed.lng - EXAMPLE_LNG) <= tolerance, `lng delta ${parsed.lng - EXAMPLE_LNG}`)
}

describe('GridReferenceFormatting position parsing', () => {
    it('round-trips decimal degrees', () => {
        assertRoundTrip(GRID_SYSTEMS.dd, 0.00001)
    })

    it('round-trips degrees and decimal minutes', () => {
        assertRoundTrip(GRID_SYSTEMS.ddm, 0.001)
    })

    it('round-trips degrees minutes seconds', () => {
        assertRoundTrip(GRID_SYSTEMS.dms, 0.001)
    })

    it('round-trips MGRS coordinates', () => {
        assertRoundTrip(GRID_SYSTEMS.mgrs, 0.001)
    })

    it('round-trips GARS coordinates', () => {
        assertRoundTrip(GRID_SYSTEMS.gars, 0.3)
    })

    it('round-trips geohash coordinates', () => {
        assertRoundTrip(GRID_SYSTEMS.geohash, 0.001)
    })

    it('round-trips GEOREF coordinates', () => {
        assertRoundTrip(GRID_SYSTEMS.georef, 0.02)
    })

    it('returns an error for invalid decimal degree input', () => {
        const parsed = parsePositionTextForGridReferenceSystem('LAT: abc', GRID_SYSTEMS.dd)

        assert.ok(parsed.error)
    })

    it('formats DD, DDM, and DMS with fixed-width numeric fields', () => {
        const [ddLat, ddLng] = formatCoordinatePairForGridReferenceSystem(
            EXAMPLE_LAT,
            EXAMPLE_LNG,
            GRID_SYSTEMS.dd,
        )
        const [ddmLat, ddmLng] = formatCoordinatePairForGridReferenceSystem(
            EXAMPLE_LAT,
            EXAMPLE_LNG,
            GRID_SYSTEMS.ddm,
        )
        const [dmsLat, dmsLng] = formatCoordinatePairForGridReferenceSystem(
            EXAMPLE_LAT,
            EXAMPLE_LNG,
            GRID_SYSTEMS.dms,
        )

        assert.equal(ddLat, '  38.89770°')
        assert.equal(ddLng, ' -77.03650°')
        assert.equal(ddmLat, '  38° 53.8620\'')
        assert.equal(ddmLng, ' -77° 02.1900\'')
        assert.equal(dmsLat, '  38° 53\' 51.72" N')
        assert.equal(dmsLng, '  77° 02\' 11.40" W')
    })
})
