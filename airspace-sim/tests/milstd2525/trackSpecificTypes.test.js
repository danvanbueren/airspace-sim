import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {TRACK_TYPES} from '../../app/tools/milstd2525/trackSymbolCodes.js'
import {
    getDefaultSpecificTypeForTrackType,
    getSpecificTypeOptionsForTrackType,
    normalizeSpecificType,
} from '../../app/tools/milstd2525/trackSpecificTypes.js'

describe('trackSpecificTypes', () => {
    it('returns fighter platforms for the fighter track type', () => {
        const options = getSpecificTypeOptionsForTrackType(TRACK_TYPES.FIGHTER)
        const labels = options.map((option) => option.label)
        const values = options.map((option) => option.value)

        assert.ok(labels.includes('F-15C Eagle'))
        assert.ok(labels.includes('F-16C Fighting Falcon'))
        assert.ok(labels.includes('F-22A Raptor'))
        assert.ok(labels.includes('F-35A Lightning II'))
        assert.ok(values.includes('Su-35S'))
        assert.ok(values.includes('J-20'))
        assert.ok(values.includes('Rafale C'))
        assert.ok(options.length > 100)
    })

    it('returns cargo platforms for the cargo track type', () => {
        const options = getSpecificTypeOptionsForTrackType('01:110107')
        const values = options.map((option) => option.value)

        assert.ok(values.includes('C-130J'))
        assert.ok(values.includes('C-17A'))
        assert.ok(values.includes('C-5M'))
        assert.ok(values.includes('Y-20'))
        assert.ok(values.includes('A400M'))
        assert.ok(options.length > 50)
    })

    it('normalizes invalid specific types back to the default for the track type', () => {
        assert.equal(
            normalizeSpecificType('F-22A', TRACK_TYPES.TANKER),
            '',
        )
        assert.equal(
            normalizeSpecificType('KC-135R', TRACK_TYPES.TANKER),
            'KC-135R',
        )
        assert.equal(
            normalizeSpecificType('E-3B', TRACK_TYPES.AWACS),
            'E-3B',
        )
    })

    it('falls back to unspecified when the track type has no platform list', () => {
        assert.deepEqual(getSpecificTypeOptionsForTrackType('01:000000'), [{value: '', label: 'Unspecified'}])
        assert.equal(getDefaultSpecificTypeForTrackType('01:000000'), '')
    })

    it('includes trainer platforms for the trainer track type', () => {
        const options = getSpecificTypeOptionsForTrackType('01:110112')
        const values = options.map((option) => option.value)

        assert.ok(values.includes('T-38A'))
        assert.ok(values.includes('Yak-130'))
        assert.ok(values.includes('JL-10'))
        assert.ok(options.length > 50)
    })
})
