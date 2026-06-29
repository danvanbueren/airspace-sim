import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {eventModifierKeysMatchBinding} from '../../app/tools/settings/controlBindingMatchers.js'
import {buildControlReference} from '../../app/tools/settings/controlReference.js'

const MOCK_CONTROL_BINDINGS = {
    keyboardCamera: {
        panUp: ['w'],
        panLeft: ['a'],
        panDown: ['s'],
        panRight: ['d'],
        panSpeedModifier: ['shift'],
        panSpeedMultiplier: 2.5,
        regularPanSpeed: 1000,
        centerMap: [],
    },
    mapCursor: {
        dragButton: 0,
        grabButton: 0,
        pointerButton: 2,
        centerButton: 1,
    },
    bearingRangeTool: {
        drawButton: 2,
        contextMenuButton: 2,
        persistModifier: ['shift'],
        contextMenuMaxMs: 250,
        contextMenuMaxPixels: 6,
        minPersistedLinePixels: 24,
    },
    scopeTool: {
        toggleGroupCriteriaCircle: ['capslock'],
    },
}

describe('eventModifierKeysMatchBinding', () => {
    it('matches shift when shift is in binding keys', () => {
        assert.equal(eventModifierKeysMatchBinding({shiftKey: true}, ['shift']), true)
        assert.equal(eventModifierKeysMatchBinding({shiftKey: false}, ['shift']), false)
    })

    it('matches control, alt, and meta', () => {
        assert.equal(eventModifierKeysMatchBinding({ctrlKey: true}, ['control']), true)
        assert.equal(eventModifierKeysMatchBinding({altKey: true}, ['alt']), true)
        assert.equal(eventModifierKeysMatchBinding({metaKey: true}, ['meta']), true)
    })

    it('returns false for empty binding keys', () => {
        assert.equal(eventModifierKeysMatchBinding({shiftKey: true}, []), false)
        assert.equal(eventModifierKeysMatchBinding({shiftKey: true}, null), false)
    })
})

describe('buildControlReference', () => {
    it('includes temporary and permanent bearing/range entries', () => {
        const sections = buildControlReference(MOCK_CONTROL_BINDINGS)
        const bearingRangeSection = sections.find((section) => section.title === 'Bearing/Range Lines')

        assert.ok(bearingRangeSection)
        assert.ok(bearingRangeSection.entries.some((entry) => entry.action.includes('temporary')))
        assert.ok(bearingRangeSection.entries.some((entry) => entry.action.includes('Keep bearing/range line')))
    })

    it('describes inverted behavior for permanent_default mode', () => {
        const sections = buildControlReference(MOCK_CONTROL_BINDINGS, {
            bearingRangeBehavior: 'permanent_default',
        })
        const bearingRangeSection = sections.find((section) => section.title === 'Bearing/Range Lines')

        assert.ok(bearingRangeSection.entries.some((entry) => entry.notes?.includes('unless the persist modifier')))
    })

    it('describes always permanent mode without modifier rows', () => {
        const sections = buildControlReference(MOCK_CONTROL_BINDINGS, {
            bearingRangeBehavior: 'always_permanent',
        })
        const bearingRangeSection = sections.find((section) => section.title === 'Bearing/Range Lines')

        assert.equal(bearingRangeSection.entries.length, 3)
        assert.ok(bearingRangeSection.entries.some((entry) => entry.action.includes('Measure and keep')))
    })

    it('documents fixed box zoom and scroll wheel controls', () => {
        const sections = buildControlReference(MOCK_CONTROL_BINDINGS)
        const navigationSection = sections.find((section) => section.title === 'Mouse Map Navigation')

        assert.ok(navigationSection.entries.some((entry) => entry.combo.includes('Shift + Left Mouse + drag')))
        assert.ok(navigationSection.entries.some((entry) => entry.combo === 'Scroll wheel'))
    })

    it('documents the group criteria circle toggle', () => {
        const sections = buildControlReference(MOCK_CONTROL_BINDINGS)
        const scopeSection = sections.find((section) => section.title === 'Map Scope Tools')

        assert.ok(scopeSection)
        assert.ok(scopeSection.entries.some((entry) => entry.action === 'Toggle group criteria circle'))
        assert.ok(scopeSection.entries.some((entry) => entry.combo.includes('Caps Lock')))
    })
})
