import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    DRAGGABLE_FLOATING_STACK_BASE,
    DRAGGABLE_FLOATING_STACK_MAX,
    getDraggableFloatingZIndex,
    UI_Z_INDEX,
} from '../../app/constants/uiZIndex.js'

describe('getDraggableFloatingZIndex', () => {
    it('starts at the floating overlay base and stays below track management windows', () => {
        assert.equal(getDraggableFloatingZIndex(0), DRAGGABLE_FLOATING_STACK_BASE)
        assert.equal(DRAGGABLE_FLOATING_STACK_BASE, UI_Z_INDEX.FLOATING_OVERLAY)
        assert.ok(getDraggableFloatingZIndex(99) < UI_Z_INDEX.SETTINGS_TOOLBELT)
        assert.equal(getDraggableFloatingZIndex(99), DRAGGABLE_FLOATING_STACK_MAX)
    })
})
