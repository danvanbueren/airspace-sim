import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    normalizeLayoutForViewport,
    viewportLayoutDiffersFromStored,
} from '../../app/actionPanels/actionPanelViewportLayout.js'
import {ACTION_PANEL_MIN_WIDTH_PX} from '../../app/actionPanels/normalizeActionPanels.js'

describe('normalizeLayoutForViewport', () => {
    it('keeps in-bounds layouts unchanged', () => {
        const layout = {
            anchor: {
                horizontal: {edge: 'left', offset: 20},
                vertical: {edge: 'top', offset: 20},
            },
            width: 400,
            height: null,
        }

        const normalized = normalizeLayoutForViewport(layout, {width: 1200, height: 800})

        assert.equal(normalized.width, 400)
        assert.equal(normalized.height, null)
        assert.equal(normalized.position.left, 20)
        assert.equal(normalized.position.top, 20)
    })

    it('pulls bottom-anchored panels back into the viewport', () => {
        const layout = {
            anchor: {
                horizontal: {edge: 'left', offset: 20},
                vertical: {edge: 'bottom', offset: 20},
            },
            width: 400,
            height: null,
        }

        const normalized = normalizeLayoutForViewport(layout, {width: 320, height: 240})

        assert.ok(normalized.position.top >= 8)
        assert.ok(normalized.position.left >= 8)
        assert.ok(normalized.position.top + 140 <= 240)
        assert.ok(normalized.width <= 320)
    })

    it('shrinks widths that exceed the available viewport', () => {
        const layout = {
            anchor: {
                horizontal: {edge: 'left', offset: 20},
                vertical: {edge: 'top', offset: 20},
            },
            width: 900,
            height: null,
        }

        const normalized = normalizeLayoutForViewport(layout, {width: 360, height: 800})

        assert.ok(normalized.width < 900)
        assert.ok(normalized.width >= ACTION_PANEL_MIN_WIDTH_PX)
        assert.ok(normalized.position.left + normalized.width <= 360)
    })

    it('reports when a stored layout needs correction', () => {
        const storedLayout = {
            anchor: {
                horizontal: {edge: 'left', offset: 20},
                vertical: {edge: 'bottom', offset: 20},
            },
            width: 900,
            height: 240,
        }
        const normalizedLayout = normalizeLayoutForViewport(storedLayout, {width: 360, height: 240})

        assert.equal(
            viewportLayoutDiffersFromStored(storedLayout, normalizedLayout),
            true,
        )
    })
})
