export function isPartialNumericInput(raw) {
    const trimmed = String(raw ?? '').trim()

    if (trimmed === '' || trimmed === '-' || trimmed === '.') {
        return true
    }

    return /^-?\d*\.?\d*$/.test(trimmed)
}

export function getDeferredNumericDraftError(raw, {integer = false} = {}) {
    const trimmed = String(raw ?? '').trim()

    if (trimmed === '') {
        return null
    }

    if (!isPartialNumericInput(trimmed)) {
        return 'Enter a valid number'
    }

    const number = Number(trimmed)

    if (!Number.isFinite(number)) {
        return 'Enter a valid number'
    }

    if (integer && !Number.isInteger(number)) {
        return 'Enter a whole number'
    }

    return null
}

export function parseDeferredNumericDraft(raw, {min, max, integer = false} = {}) {
    const trimmed = String(raw ?? '').trim()

    if (trimmed === '') {
        return {ok: false, error: 'Enter a value'}
    }

    if (!isPartialNumericInput(trimmed)) {
        return {ok: false, error: 'Enter a valid number'}
    }

    const number = Number(trimmed)

    if (!Number.isFinite(number)) {
        return {ok: false, error: 'Enter a valid number'}
    }

    if (integer && !Number.isInteger(number)) {
        return {ok: false, error: 'Enter a whole number'}
    }

    let value = number
    let adjustmentNote = null

    if (min !== undefined && value < min) {
        value = min
        adjustmentNote = `Adjusted to minimum (${min})`
    }

    if (max !== undefined && value > max) {
        value = max
        adjustmentNote = `Adjusted to maximum (${max})`
    }

    return {
        ok: true,
        value,
        adjustmentNote,
    }
}

export function formatDeferredNumericCommitted(value, {integer = false} = {}) {
    if (value === '' || value === null || value === undefined) {
        return ''
    }

    const number = Number(value)

    if (!Number.isFinite(number)) {
        return ''
    }

    return integer ? String(Math.round(number)) : String(number)
}

export function createDeferredNumericFieldConfig({
    min,
    max,
    integer = false,
    formatDisplay,
}) {
    return {
        formatCommitted: (value) => (
            formatDisplay
                ? formatDisplay(value)
                : formatDeferredNumericCommitted(value, {integer})
        ),
        getDraftError: (raw) => getDeferredNumericDraftError(raw, {integer}),
        parseDraft: (raw) => parseDeferredNumericDraft(raw, {min, max, integer}),
    }
}
