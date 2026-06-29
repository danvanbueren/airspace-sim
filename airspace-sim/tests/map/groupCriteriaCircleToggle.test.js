import assert from 'node:assert/strict'
import {describe, it} from 'node:test'
import {
    bindingUsesCapsLock,
    eventMatchesCapsLockToggleBinding,
    resolveGroupCriteriaCircleVisible,
    resolveNextCapsLockActive,
} from '../../app/tools/map/groupCriteriaCircleToggle.js'

function createKeyboardEvent(type, {
    key = 'CapsLock',
    code = 'CapsLock',
    capsLock = false,
} = {}) {
    return {
        type,
        key,
        code,
        getModifierState(modifier) {
            if (modifier === 'CapsLock') {
                return capsLock
            }

            return false
        },
    }
}

describe('bindingUsesCapsLock', () => {
    it('detects caps lock bindings', () => {
        assert.equal(bindingUsesCapsLock(['capslock']), true)
        assert.equal(bindingUsesCapsLock(['f']), false)
    })
})

describe('eventMatchesCapsLockToggleBinding', () => {
    it('matches caps lock by key or code', () => {
        assert.equal(
            eventMatchesCapsLockToggleBinding(createKeyboardEvent('keydown'), ['capslock']),
            true,
        )
        assert.equal(
            eventMatchesCapsLockToggleBinding(createKeyboardEvent('keydown', {key: 'a'}), ['capslock']),
            false,
        )
    })
})

describe('resolveNextCapsLockActive', () => {
    it('reads modifier state from non-caps-lock keys', () => {
        const event = createKeyboardEvent('keydown', {key: 'a', code: 'KeyA', capsLock: true})

        assert.equal(resolveNextCapsLockActive(false, event, ['capslock']), true)
    })

    it('flips when caps lock key reports a stale modifier state', () => {
        const event = createKeyboardEvent('keydown', {capsLock: true})

        assert.equal(resolveNextCapsLockActive(true, event, ['capslock']), false)
    })

    it('uses modifier state when caps lock key reports a changed state', () => {
        const event = createKeyboardEvent('keydown', {capsLock: false})

        assert.equal(resolveNextCapsLockActive(true, event, ['capslock']), false)
    })
})

describe('resolveGroupCriteriaCircleVisible', () => {
    it('uses caps lock state when bound to caps lock', () => {
        assert.equal(resolveGroupCriteriaCircleVisible({
            usesCapsLockBinding: true,
            capsLockActive: true,
            alternateToggleActive: false,
        }), true)
    })

    it('uses alternate toggle state for other bindings', () => {
        assert.equal(resolveGroupCriteriaCircleVisible({
            usesCapsLockBinding: false,
            capsLockActive: true,
            alternateToggleActive: false,
        }), false)
    })
})
