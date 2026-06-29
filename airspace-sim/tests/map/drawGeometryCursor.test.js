import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {getDrawGeometryCursor} from '../../app/tools/map/drawGeometry/drawGeometryCursor.js'

describe('draw geometry cursor', () => {
    it('returns a pen svg cursor with crosshair fallback', () => {
        const darkCursor = getDrawGeometryCursor('dark')
        const lightCursor = getDrawGeometryCursor('light')

        assert.match(darkCursor, /^url\("data:image\/svg\+xml,/)
        assert.match(darkCursor, /crosshair$/)
        assert.match(lightCursor, /^url\("data:image\/svg\+xml,/)
        assert.notEqual(darkCursor, lightCursor)
    })
})
