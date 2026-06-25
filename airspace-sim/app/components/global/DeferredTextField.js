'use client'

import {TextField} from '@mui/material'
import {useDeferredTextField} from '@/app/hooks/ui/useDeferredTextField'

export default function DeferredTextField({
    committedValue,
    onCommit,
    formatCommitted,
    getDraftError,
    parseDraft,
    helperText,
    onFocus,
    onBlur,
    slotProps,
    ...textFieldProps
}) {
    const deferredField = useDeferredTextField({
        committedValue,
        onCommit,
        formatCommitted,
        getDraftError,
        parseDraft,
        helperText,
        onFocus,
        onBlur,
    })

    return (
        <TextField
            {...textFieldProps}
            value={deferredField.value}
            onFocus={deferredField.onFocus}
            onChange={deferredField.onChange}
            onBlur={deferredField.onBlur}
            error={deferredField.error}
            helperText={deferredField.helperText}
            slotProps={{
                ...deferredField.slotProps,
                ...slotProps,
                htmlInput: {
                    ...deferredField.slotProps.htmlInput,
                    ...slotProps?.htmlInput,
                },
            }}
        />
    )
}
