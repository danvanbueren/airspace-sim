'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {Box, FormHelperText, Grid, IconButton, InputAdornment, TextField} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
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
    const positionRowCount = formatPositionTextForGridReferenceSystem(
        lat,
        lng,
        gridReferenceSystem,
    ).split('\n').length

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

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(displayText)
        } catch {
            // Clipboard access can fail in unsupported or non-secure contexts.
        }
    }, [displayText])

    return (
        <Box>
            <Grid container spacing={1} sx={{alignItems: 'flex-start'}}>
                <Grid size='grow' sx={{minWidth: 0}}>
                    <TextField
                        label='Position'
                        size='small'
                        multiline
                        minRows={positionRowCount}
                        maxRows={4}
                        value={displayText}
                        onFocus={handleFocus}
                        onChange={(event) => setDraft(event.target.value)}
                        onBlur={handleBlur}
                        error={Boolean(error)}
                        disabled={disabled}
                        fullWidth
                        slotProps={{
                            htmlInput: TEXT_INPUT_ENTER_BLUR_SLOT_PROPS.htmlInput,
                            input: {
                                endAdornment: (
                                    <InputAdornment
                                        position='end'
                                        sx={{alignSelf: 'center'}}
                                    >
                                        <IconButton
                                            aria-label='Copy position'
                                            edge='end'
                                            size='small'
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={handleCopy}
                                            disabled={disabled || !displayText}
                                        >
                                            <ContentCopyIcon fontSize='inherit'/>
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                        }}
                        sx={{
                            '& .MuiInputBase-input': {
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                whiteSpace: 'pre',
                            },
                        }}
                    />
                </Grid>
                <Grid
                    size='auto'
                    sx={{
                        display: 'flex',
                        minWidth: '3rem',
                        alignSelf: 'stretch',
                        pt: '8px',
                        boxSizing: 'border-box',
                    }}
                >
                    <GridReferenceSystemSelect
                        value={gridReferenceSystem}
                        onChange={handleGridReferenceSystemChange}
                        zIndex={zIndex}
                        disabled={disabled}
                        matchInputHeight
                        sx={{width: '100%'}}
                    />
                </Grid>
            </Grid>
            {error ? (
                <FormHelperText error sx={{mx: 1.75, mt: 0.5}}>
                    {error}
                </FormHelperText>
            ) : null}
        </Box>
    )
}
