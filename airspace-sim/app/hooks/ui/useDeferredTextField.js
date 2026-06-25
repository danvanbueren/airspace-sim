'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {TEXT_INPUT_ENTER_BLUR_SLOT_PROPS} from '@/app/tools/ui/textInputSlotProps'

function valuesAreEqual(left, right) {
    return Object.is(left, right)
}

export function useDeferredTextField({
    committedValue,
    onCommit,
    formatCommitted = (value) => String(value ?? ''),
    getDraftError,
    parseDraft,
    helperText: staticHelperText,
    onFocus: onFocusSideEffect,
    onBlur: onBlurSideEffect,
}) {
    const [draft, setDraft] = useState(() => formatCommitted(committedValue))
    const [error, setError] = useState(null)
    const [adjustmentNote, setAdjustmentNote] = useState(null)
    const [isFocused, setIsFocused] = useState(false)
    const committedValueRef = useRef(committedValue)

    committedValueRef.current = committedValue

    useEffect(() => {
        if (isFocused) {
            return
        }

        setDraft(formatCommitted(committedValue))
        setError(null)
        setAdjustmentNote(null)
    }, [committedValue, formatCommitted, isFocused])

    const handleFocus = useCallback((event) => {
        setIsFocused(true)
        setDraft(formatCommitted(committedValueRef.current))
        setError(null)
        setAdjustmentNote(null)
        onFocusSideEffect?.(event)
    }, [formatCommitted, onFocusSideEffect])

    const handleChange = useCallback((event) => {
        const nextDraft = event.target.value

        setDraft(nextDraft)
        setAdjustmentNote(null)
        setError(getDraftError ? getDraftError(nextDraft) : null)
    }, [getDraftError])

    const handleBlur = useCallback((event) => {
        setIsFocused(false)
        onBlurSideEffect?.(event)

        const result = parseDraft(draft)

        if (!result.ok) {
            setDraft(formatCommitted(committedValueRef.current))
            setError(result.error)
            setAdjustmentNote(null)
            return
        }

        const nextCommittedDisplay = formatCommitted(result.value)

        setDraft(nextCommittedDisplay)
        setError(null)
        setAdjustmentNote(result.adjustmentNote ?? null)

        if (!valuesAreEqual(result.value, committedValueRef.current)) {
            onCommit(result.value)
        }
    }, [draft, formatCommitted, onBlurSideEffect, onCommit, parseDraft])

    return {
        value: draft,
        onFocus: handleFocus,
        onChange: handleChange,
        onBlur: handleBlur,
        error: Boolean(error),
        helperText: error ?? adjustmentNote ?? staticHelperText,
        slotProps: TEXT_INPUT_ENTER_BLUR_SLOT_PROPS,
    }
}
