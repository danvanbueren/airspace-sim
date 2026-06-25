import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    createDeferredNumericFieldConfig,
    formatDeferredNumericCommitted,
    getDeferredNumericDraftError,
    isPartialNumericInput,
    parseDeferredNumericDraft,
} from '../../app/tools/ui/deferredNumericField.js'

describe('deferredNumericField', () => {
    describe('isPartialNumericInput', () => {
        it('allows empty and in-progress numeric strings', () => {
            assert.equal(isPartialNumericInput(''), true)
            assert.equal(isPartialNumericInput('15'), true)
            assert.equal(isPartialNumericInput('15.'), true)
            assert.equal(isPartialNumericInput('.5'), true)
        })

        it('rejects non-numeric characters', () => {
            assert.equal(isPartialNumericInput('12a'), false)
            assert.equal(isPartialNumericInput('abc'), false)
        })
    })

    describe('getDeferredNumericDraftError', () => {
        it('does not block partial numeric entry', () => {
            assert.equal(getDeferredNumericDraftError('1', {integer: true}), null)
            assert.equal(getDeferredNumericDraftError('150', {integer: true}), null)
        })

        it('flags clearly invalid input while typing', () => {
            assert.equal(getDeferredNumericDraftError('12x', {integer: true}), 'Enter a valid number')
        })
    })

    describe('parseDeferredNumericDraft', () => {
        it('clamps out-of-range values on commit', () => {
            const result = parseDeferredNumericDraft('99999', {min: 500, max: 30000, integer: true})

            assert.equal(result.ok, true)
            assert.equal(result.value, 30000)
            assert.match(result.adjustmentNote, /maximum/)
        })

        it('rejects empty commit attempts', () => {
            const result = parseDeferredNumericDraft('', {min: 0, max: 10, integer: true})

            assert.equal(result.ok, false)
            assert.equal(result.error, 'Enter a value')
        })
    })

    describe('createDeferredNumericFieldConfig', () => {
        it('formats committed integers for display', () => {
            const config = createDeferredNumericFieldConfig({min: 2, max: 30, integer: true})

            assert.equal(config.formatCommitted(12), '12')
            assert.equal(formatDeferredNumericCommitted(12.7, {integer: true}), '13')
        })
    })
})
