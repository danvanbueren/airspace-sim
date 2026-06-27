import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    buildClearedControlBindings,
    DEFAULT_CONTROL_BINDINGS,
    MOUSE_BUTTONS,
    UNBOUND_CONTROL_BINDINGS,
} from '../../app/tools/settings/controlBindingsDefaults.js'

describe('UNBOUND_CONTROL_BINDINGS', () => {
    it('clears bearing/range mouse buttons', () => {
        assert.equal(UNBOUND_CONTROL_BINDINGS.bearingRangeTool.drawButton, MOUSE_BUTTONS.unbound)
        assert.equal(UNBOUND_CONTROL_BINDINGS.bearingRangeTool.contextMenuButton, MOUSE_BUTTONS.unbound)
    })

    it('clears bearing/range keyboard bindings', () => {
        assert.deepEqual(UNBOUND_CONTROL_BINDINGS.bearingRangeTool.persistModifier, [])
    })

    it('preserves advanced bearing/range sensitivity defaults', () => {
        assert.equal(
            UNBOUND_CONTROL_BINDINGS.bearingRangeTool.contextMenuMaxMs,
            DEFAULT_CONTROL_BINDINGS.bearingRangeTool.contextMenuMaxMs,
        )
        assert.equal(
            UNBOUND_CONTROL_BINDINGS.bearingRangeTool.minPersistedLinePixels,
            DEFAULT_CONTROL_BINDINGS.bearingRangeTool.minPersistedLinePixels,
        )
    })

    it('clears map cursor and keyboard camera bindings', () => {
        assert.equal(UNBOUND_CONTROL_BINDINGS.mapCursor.dragButton, MOUSE_BUTTONS.unbound)
        assert.deepEqual(UNBOUND_CONTROL_BINDINGS.keyboardCamera.panUp, [])
        assert.deepEqual(UNBOUND_CONTROL_BINDINGS.keyboardCamera.centerMap, [])
    })
})

describe('buildClearedControlBindings', () => {
    it('clears bearing/range mouse buttons from customized bindings', () => {
        const cleared = buildClearedControlBindings(DEFAULT_CONTROL_BINDINGS)

        assert.equal(cleared.bearingRangeTool.drawButton, MOUSE_BUTTONS.unbound)
        assert.equal(cleared.bearingRangeTool.contextMenuButton, MOUSE_BUTTONS.unbound)
    })
})
