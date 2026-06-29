import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    getDefaultNationality,
    getNationalityOptions,
    normalizeNationality,
} from '../../app/tools/milstd2525/trackNationalities.js'

describe('trackNationalities', () => {
    it('includes an unspecified option and a broad country catalog', () => {
        const options = getNationalityOptions()

        assert.equal(options[0].value, '')
        assert.equal(options[0].label, 'Unspecified')
        assert.ok(options.length >= 200)
        assert.ok(options.some((option) => option.value === 'US' && option.label === 'United States'))
        assert.ok(options.some((option) => option.value === 'GB' && option.label === 'United Kingdom'))
    })

    it('normalizes unknown values to unspecified', () => {
        assert.equal(getDefaultNationality(), '')
        assert.equal(normalizeNationality('US'), 'US')
        assert.equal(normalizeNationality('ZZ'), '')
        assert.equal(normalizeNationality(null), '')
    })
})
