'use client'

import {useEffect, useRef, useState} from 'react'
import {Grid, TextField, Typography} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import GridReferenceSystemSelect from '@/app/components/map/GridReferenceSystemSelect'
import {
    formatPositionTextForGridReferenceSystem,
    parsePositionTextForGridReferenceSystem,
} from '@/app/tools/formatting/GridReferenceFormatting'
import {TEXT_INPUT_ENTER_BLUR_SLOT_PROPS} from '@/app/tools/ui/textInputSlotProps'

function coordinatesEqual(first, second) {
    return Math.abs(first.lat - second.lat) < 1e-9
        && Math.abs(first.lng - second.lng) < 1e-9
}

export default function PositionReferenceEditor({
    lat,
    lng,
    onCommit,
    onFocus,
    onBlur,
    zIndex,
    disabled = false,
}) {
    const {appSettings, setGridReferenceSystem} = useAppSettings()
    const [draft, setDraft] = useState(null)
    const [error, setError] = useState(null)
    const isFocusedRef = useRef(false)
    const gridReferenceSystem = appSettings.gridReferenceSystem

    const committedText = formatPositionTextForGridReferenceSystem(lat, lng, gridReferenceSystem)
    const displayText = draft ?? committedText

    useEffect(() => {
        if (!isFocusedRef.current && draft === null) {
            setError(null)
        }
    }, [committedText, draft])

    const handleFocus = () => {
        isFocusedRef.current = true
        setDraft(committedText)
        setError(null)
        onFocus?.()
    }

    const handleBlur = () => {
        isFocusedRef.current = false
        const textToParse = draft ?? committedText
        const parsed = parsePositionTextForGridReferenceSystem(textToParse, gridReferenceSystem)

        setDraft(null)

        if (parsed.error) {
            setError(parsed.error)
            onBlur?.()
            return
        }

        setError(null)

        if (!coordinatesEqual(parsed, {lat, lng})) {
            onCommit?.(parsed)
        }

        onBlur?.()
    }

    const handleGridReferenceSystemChange = (nextGridReferenceSystem) => {
        if (isFocusedRef.current && draft !== null) {
            const parsed = parsePositionTextForGridReferenceSystem(draft, gridReferenceSystem)

            if (!parsed.error) {
                setDraft(formatPositionTextForGridReferenceSystem(
                    parsed.lat,
                    parsed.lng,
                    nextGridReferenceSystem,
                ))
            }
        }

        setGridReferenceSystem(nextGridReferenceSystem)
    }

    return (
        <>
            <Grid container spacing={1} sx={{display: 'flex', alignItems: 'center'}}>
                <Grid size='auto'>
                    <Typography sx={{fontWeight: 'bold', fontSize: '0.8rem'}}>
                        Position
                    </Typography>
                </Grid>
                <Grid size='grow' sx={{display: 'flex', justifyContent: 'flex-end'}}>
                    <GridReferenceSystemSelect
                        value={gridReferenceSystem}
                        onChange={handleGridReferenceSystemChange}
                        zIndex={zIndex}
                        disabled={disabled}
                    />
                </Grid>
            </Grid>

            <TextField
                aria-label='Position'
                size='small'
                multiline
                minRows={formatPositionTextForGridReferenceSystem(lat, lng, gridReferenceSystem).split('\n').length}
                maxRows={4}
                value={displayText}
                onFocus={handleFocus}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={handleBlur}
                slotProps={TEXT_INPUT_ENTER_BLUR_SLOT_PROPS}
                error={Boolean(error)}
                helperText={error ?? undefined}
                disabled={disabled}
                fullWidth
                sx={{
                    '& .MuiInputBase-input': {
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        whiteSpace: 'pre',
                    },
                }}
            />
        </>
    )
}
