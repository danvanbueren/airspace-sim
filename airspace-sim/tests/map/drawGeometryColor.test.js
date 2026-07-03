import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    setFillColorForMode,
    setStrokeColorForMode,
    convertStrokeColorForOppositeMode,
} from '../../app/tools/map/drawGeometry/drawGeometryColor.js'

describe('draw geometry color styling', () => {
    it('correctly sets stroke color and opposite mode stroke color', () => {
        const colors = {
            dark: '#ffffff',
            light: '#111111',
        }

        // Selecting white in dark mode converts to something dark in light mode
        const result = setStrokeColorForMode(colors, 'dark', '#ffffff')
        assert.equal(result.dark, '#ffffff')
        assert.equal(result.light, '#000000')

        // Selecting yellow in dark mode
        const resultYellow = setStrokeColorForMode(colors, 'dark', '#ffb300')
        assert.equal(resultYellow.dark, '#ffb300')
        // Yellow should become a darker orange/brown in light mode for readability
        assert.notEqual(resultYellow.light, '#ffb300')
        assert.ok(resultYellow.light.startsWith('#'))
    })

    it('correctly sets fill color and opposite mode fill color', () => {
        const colors = {
            dark: '#ffffff',
            light: '#111111',
        }

        const result = setFillColorForMode(colors, 'dark', '#ffb300')
        assert.equal(result.dark, '#ffb300')
        assert.ok(result.light.startsWith('#'))
    })
})
