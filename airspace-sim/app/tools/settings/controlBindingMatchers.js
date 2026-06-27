function normalizeKey(key) {
    return key.toLowerCase()
}

export function eventModifierKeysMatchBinding(event, bindingKeys) {
    if (!bindingKeys?.length) {
        return false
    }

    return bindingKeys.some((key) => {
        const normalizedKey = normalizeKey(key)

        if (normalizedKey === 'shift') {
            return event.shiftKey
        }

        if (normalizedKey === 'control') {
            return event.ctrlKey
        }

        if (normalizedKey === 'alt') {
            return event.altKey
        }

        if (normalizedKey === 'meta') {
            return event.metaKey
        }

        return false
    })
}
