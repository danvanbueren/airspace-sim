import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    formatEditableWholeNumber,
    formatHeadingDisplay,
    formatAltitudeFeet,
    formatSpeedKnots,
    normalizeHeading,
    parseTrackKinematicFields,
    parseWholeNumberInput,
} from '../../app/tools/formatting/trackFieldFormatting.js'

describe('trackFieldFormatting', () => {
    describe('normalizeHeading', () => {
        it('keeps headings within 0-359', () => {
            assert.equal(normalizeHeading(0), 0)
            assert.equal(normalizeHeading(359), 359)
            assert.equal(normalizeHeading(180), 180)
        })

        it('wraps headings above 359', () => {
            assert.equal(normalizeHeading(360), 0)
            assert.equal(normalizeHeading(370), 10)
            assert.equal(normalizeHeading(720), 0)
        })

        it('wraps negative headings', () => {
            assert.equal(normalizeHeading(-10), 350)
            assert.equal(normalizeHeading(-360), 0)
        })

        it('parses formatted input before normalizing', () => {
            assert.equal(normalizeHeading('400'), 40)
        })

        it('defaults empty input to 0', () => {
            assert.equal(normalizeHeading(''), 0)
            assert.equal(normalizeHeading(null), 0)
        })
    })

    describe('display formatting', () => {
        it('formats heading as three digits', () => {
            assert.equal(formatHeadingDisplay(0), '000')
            assert.equal(formatHeadingDisplay(50), '050')
            assert.equal(formatHeadingDisplay(90), '090')
            assert.equal(formatHeadingDisplay('090'), '090')
            assert.equal(formatHeadingDisplay(359), '359')
        })

        it('formats editable whole numbers without leading zeros or commas', () => {
            assert.equal(formatEditableWholeNumber('0450'), '450')
            assert.equal(formatEditableWholeNumber('35,000'), '35000')
        })

        it('formats altitude and speed with grouping separators', () => {
            assert.equal(formatAltitudeFeet(35000), '35,000')
            assert.equal(formatSpeedKnots(1200), '1,200')
            assert.equal(formatAltitudeFeet('035000'), '35,000')
        })

        it('returns empty string for empty grouped values', () => {
            assert.equal(formatAltitudeFeet(''), '')
            assert.equal(formatSpeedKnots(null), '')
        })
    })

    describe('parseTrackKinematicFields', () => {
        it('stores raw numeric kinematic values', () => {
            assert.deepEqual(parseTrackKinematicFields({
                heading: 370,
                speed: 450,
                altitude: 35000,
            }), {
                heading: 10,
                speed: 450,
                altitude: 35000,
            })
        })

        it('leaves optional speed and altitude empty', () => {
            assert.deepEqual(parseTrackKinematicFields({
                heading: 90,
                speed: null,
                altitude: undefined,
            }), {
                heading: 90,
                speed: '',
                altitude: '',
            })
        })
    })

    describe('parseWholeNumberInput', () => {
        it('strips commas from user input', () => {
            assert.equal(parseWholeNumberInput('35,000'), 35000)
        })
    })
})
