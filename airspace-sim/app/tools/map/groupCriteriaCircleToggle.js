export function bindingUsesCapsLock(toggleBindingKeys) {
    return toggleBindingKeys.some((key) => key.toLowerCase() === 'capslock')
}

export function eventMatchesCapsLockToggleBinding(event, toggleBindingKeys) {
    if (!event) {
        return false
    }

    const normalizedKeys = toggleBindingKeys.map((key) => key.toLowerCase())
    const eventKey = typeof event.key === 'string' ? event.key.toLowerCase() : ''

    return normalizedKeys.includes(eventKey) || event.code === 'CapsLock'
}

export function readCapsLockStateFromEvent(event) {
    if (!event?.getModifierState) {
        return false
    }

    return event.getModifierState('CapsLock')
}

export function resolveNextCapsLockActive(previousActive, event, toggleBindingKeys) {
    if (!eventMatchesCapsLockToggleBinding(event, toggleBindingKeys)) {
        return readCapsLockStateFromEvent(event)
    }

    const modifierState = readCapsLockStateFromEvent(event)

    if (modifierState === previousActive) {
        return !previousActive
    }

    return modifierState
}

export function resolveGroupCriteriaCircleVisible({
    usesCapsLockBinding,
    capsLockActive,
    alternateToggleActive,
}) {
    return usesCapsLockBinding ? capsLockActive : alternateToggleActive
}
