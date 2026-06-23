'use client'

import {forwardRef, useCallback, useEffect, useRef, useState} from 'react'
import {
    Box,
    Checkbox,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    ListSubheader,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {useMeasuredElementSize} from '@/app/hooks/global/useMeasuredElementSize'
import {formatCoordinatePairForGridReferenceSystem} from '@/app/tools/formatting/GridReferenceFormatting'
import {
    formatEditableWholeNumber,
    formatHeadingDisplay,
    formatWholeNumberWithCommas,
    normalizeHeading,
    parseWholeNumberInput,
} from '@/app/tools/formatting/trackFieldFormatting'
import {
    getCallsignValidationError,
    sanitizeCallsignInput,
} from '@/app/tools/formatting/callsignValidation'
import {
    TRACK_DOMAINS,
    TRACK_IDENTITY_OPTIONS,
    getDefaultTrackTypeForDomain,
    getTrackTypeOption,
    getTrackTypeOptionsForDomain,
} from '@/app/tools/milstd2525/trackSymbolCodes'
import {
    getDefaultSpecificTypeForTrackType,
    getSpecificTypeOptionsForTrackType,
    normalizeSpecificType,
} from '@/app/tools/milstd2525/trackSpecificTypes'
import {TRACK_CORRELATION_MODES} from '@/app/simulation/trackFromDetection'
import {expandTrackManagementWindowSkipLiveFields} from '@/app/tools/map/trackManagementTrack'
import {
    getTrackManagementWindowPosition,
    useTrackManagementWindowDrag,
} from '@/app/hooks/map/useTrackManagementWindowDrag'

const CORRELATION_MODE_OPTIONS = [
    {value: TRACK_CORRELATION_MODES.ACTIVE, label: 'Active'},
    {value: TRACK_CORRELATION_MODES.EXTRAPOLATED, label: 'Extrapolated'},
    {value: TRACK_CORRELATION_MODES.SUSPEND, label: 'Suspended'},
]

function formatEnumLabel(value) {
    return value
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (character) => character.toUpperCase())
}

function formatOptionalGroupedWholeNumber(value) {
    if (value === '' || value === null || value === undefined) {
        return ''
    }

    return formatWholeNumberWithCommas(value)
}

function getCommittedKinematicDisplay(field, value) {
    if (field === 'heading') {
        return formatHeadingDisplay(value)
    }

    return formatOptionalGroupedWholeNumber(value)
}

function getEditableKinematicDraft(field, value) {
    if (field === 'heading') {
        return formatHeadingDisplay(value)
    }

    return formatEditableWholeNumber(value)
}

function parseCommittedKinematicField(field, rawValue) {
    if (field === 'heading') {
        return normalizeHeading(rawValue)
    }

    return parseWholeNumberInput(rawValue)
}

function blurTextInputOnEnter(event) {
    if (event.key !== 'Enter') {
        return
    }

    event.preventDefault()
    event.currentTarget.blur()
}

const TEXT_INPUT_ENTER_BLUR_SLOT_PROPS = {
    htmlInput: {
        onKeyDown: blurTextInputOnEnter,
    },
}

function filterOptionsBySearch(options, searchQuery) {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
        return options
    }

    return options.filter((option) => (
        option.label.toLowerCase().includes(normalizedQuery)
        || String(option.value).toLowerCase().includes(normalizedQuery)
    ))
}

function SearchableSelect({
    label,
    labelId,
    value,
    options,
    onChange,
    disabled = false,
    emptyResultsLabel = 'No matching options',
    zIndex,
    onOpen,
    onClose,
}) {
    const [searchQuery, setSearchQuery] = useState('')
    const filteredOptions = filterOptionsBySearch(options, searchQuery)

    const handleClose = () => {
        setSearchQuery('')
        onClose?.()
    }

    return (
        <FormControl size='small' fullWidth disabled={disabled}>
            <InputLabel id={labelId}>
                {label}
            </InputLabel>
            <Select
                labelId={labelId}
                label={label}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onOpen={onOpen}
                onClose={handleClose}
                MenuProps={{
                    autoFocus: false,
                    disableAutoFocusItem: true,
                    slotProps: {
                        paper: {
                            sx: {
                                maxHeight: 320,
                                zIndex: (zIndex ?? 1300) + 1,
                            },
                        },
                    },
                }}
            >
                <ListSubheader sx={{lineHeight: 1, px: 1.5, pt: 1, pb: 1}}>
                    <TextField
                        size='small'
                        placeholder={`Search ${label.toLowerCase()}...`}
                        fullWidth
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onKeyDown={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                    />
                </ListSubheader>
                {filteredOptions.length === 0 ? (
                    <MenuItem disabled dense sx={{opacity: 1}}>
                        <Typography variant='body2' color='text.secondary'>
                            {emptyResultsLabel}
                        </Typography>
                    </MenuItem>
                ) : (
                    filteredOptions.map((option) => (
                        <MenuItem key={option.value || 'unspecified'} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))
                )}
            </Select>
        </FormControl>
    )
}

const TrackManagementWindow = forwardRef(function TrackManagementWindow({
                                                                            trackManagementWindow,
                                                                            mapContainerRef,
                                                                            tracksForCallsignValidation = [],
                                                                            onChange,
                                                                            onMove,
                                                                            onActivate,
                                                                            onClaimKeyboardCustody,
                                                                            onClose,
                                                                            onSkipLiveFieldsChange,
                                                                            hasKeyboardCustody = false,
                                                                            zIndex,
                                                                        }, ref) {
    const {appSettings} = useAppSettings()
    const trackManagementWindowRef = useRef(null)
    const [kinematicFieldDrafts, setKinematicFieldDrafts] = useState({})
    const [callsignDraft, setCallsignDraft] = useState(null)
    const [callsignError, setCallsignError] = useState(null)
    const [focusedFields, setFocusedFields] = useState(() => new Set())
    const trackManagementWindowSize = useMeasuredElementSize(
        trackManagementWindowRef,
        [trackManagementWindow, appSettings.gridReferenceSystem],
    )
    const setTrackManagementWindowRef = useCallback((element) => {
        trackManagementWindowRef.current = element

        if (typeof ref === 'function') {
            ref(element)
        } else if (ref) {
            ref.current = element
        }
    }, [ref])

    useEffect(() => {
        setKinematicFieldDrafts({})
        setCallsignDraft(null)
        setCallsignError(null)
        setFocusedFields(new Set())
        onSkipLiveFieldsChange?.(trackManagementWindow.id, new Set())
    }, [onSkipLiveFieldsChange, trackManagementWindow.id])

    const publishSkipLiveFields = useCallback((
        nextFocusedFields = focusedFields,
        nextKinematicDrafts = kinematicFieldDrafts,
        nextCallsignDraft = callsignDraft,
    ) => {
        onSkipLiveFieldsChange?.(
            trackManagementWindow.id,
            expandTrackManagementWindowSkipLiveFields(
                nextFocusedFields,
                nextKinematicDrafts,
                nextCallsignDraft,
            ),
        )
    }, [
        callsignDraft,
        focusedFields,
        kinematicFieldDrafts,
        onSkipLiveFieldsChange,
        trackManagementWindow.id,
    ])

    useEffect(() => () => {
        onSkipLiveFieldsChange?.(trackManagementWindow.id, new Set())
    }, [onSkipLiveFieldsChange, trackManagementWindow.id])

    const handleFieldFocus = useCallback((field) => {
        if (focusedFields.has(field)) {
            return
        }

        const nextFocusedFields = new Set(focusedFields)
        nextFocusedFields.add(field)
        publishSkipLiveFields(nextFocusedFields)
        setFocusedFields(nextFocusedFields)
    }, [focusedFields, publishSkipLiveFields])

    const handleFieldBlur = useCallback((field) => {
        if (!focusedFields.has(field)) {
            return
        }

        const nextFocusedFields = new Set(focusedFields)
        nextFocusedFields.delete(field)
        publishSkipLiveFields(nextFocusedFields)
        setFocusedFields(nextFocusedFields)
    }, [focusedFields, publishSkipLiveFields])

    useEffect(() => {
        if (callsignDraft === null) {
            setCallsignError(null)
        }
    }, [trackManagementWindow.callsign, callsignDraft])

    const formattedCoordinates = formatCoordinatePairForGridReferenceSystem(
        trackManagementWindow.lngLat.lat,
        trackManagementWindow.lngLat.lng,
        appSettings.gridReferenceSystem,
    )

    const availableTrackTypes = getTrackTypeOptionsForDomain(trackManagementWindow.domain)
    const selectedTrackType = getTrackTypeOption(
        trackManagementWindow.type,
        trackManagementWindow.domain,
    )?.value ?? getDefaultTrackTypeForDomain(trackManagementWindow.domain)
    const availableSpecificTypes = getSpecificTypeOptionsForTrackType(selectedTrackType)
    const selectedSpecificType = normalizeSpecificType(
        trackManagementWindow.specificType,
        selectedTrackType,
    )

    const updateField = (field, value) => {
        const updates = {
            [field]: value,
        }

        if (field === 'domain') {
            const existingTypeOption = getTrackTypeOption(trackManagementWindow.type, value)

            updates.type = existingTypeOption?.value ?? getDefaultTrackTypeForDomain(value)
            updates.specificType = getDefaultSpecificTypeForTrackType(updates.type)
        }

        if (field === 'type') {
            updates.specificType = getDefaultSpecificTypeForTrackType(value)
        }

        onChange(trackManagementWindow.id, updates)
    }

    const beginKinematicFieldEdit = (field) => {
        const nextDrafts = {
            ...kinematicFieldDrafts,
            [field]: getEditableKinematicDraft(field, trackManagementWindow[field]),
        }

        publishSkipLiveFields(focusedFields, nextDrafts)
        setKinematicFieldDrafts(nextDrafts)
    }

    const updateKinematicFieldDraft = (field, rawValue) => {
        setKinematicFieldDrafts((currentDrafts) => ({
            ...currentDrafts,
            [field]: rawValue,
        }))
    }

    const commitKinematicFieldDraft = (field) => {
        const draft = kinematicFieldDrafts[field]

        if (draft === undefined) {
            return
        }

        const nextDrafts = {...kinematicFieldDrafts}
        delete nextDrafts[field]

        publishSkipLiveFields(focusedFields, nextDrafts)
        setKinematicFieldDrafts(nextDrafts)
        updateField(field, parseCommittedKinematicField(field, draft))
    }

    const getKinematicFieldDisplayValue = (field) => {
        const draft = kinematicFieldDrafts[field]

        if (draft !== undefined) {
            return draft
        }

        return getCommittedKinematicDisplay(field, trackManagementWindow[field])
    }

    const handleCallsignChange = (event) => {
        const sanitized = sanitizeCallsignInput(event.target.value)
        const error = getCallsignValidationError(
            sanitized,
            tracksForCallsignValidation,
            trackManagementWindow.trackId,
        )

        if (!error) {
            publishSkipLiveFields(focusedFields, kinematicFieldDrafts, null)
            setCallsignDraft(null)
            setCallsignError(null)
            updateField('callsign', sanitized)
            return
        }

        publishSkipLiveFields(focusedFields, kinematicFieldDrafts, sanitized)
        setCallsignDraft(sanitized)
        setCallsignError(error)
    }

    const handleCallsignBlur = () => {
        if (callsignError) {
            publishSkipLiveFields(focusedFields, kinematicFieldDrafts, null)
            setCallsignDraft(null)
            setCallsignError(null)
        }
    }

    const displayCallsign = callsignDraft ?? trackManagementWindow.callsign

    const activateWindow = useCallback(() => {
        if (trackManagementWindow.dismissOnMapClick) {
            onActivate?.(trackManagementWindow.id)
        }
    }, [onActivate, trackManagementWindow.dismissOnMapClick, trackManagementWindow.id])

    const handleWindowPointerDown = useCallback((event) => {
        event.stopPropagation()
        activateWindow()
        onClaimKeyboardCustody?.(trackManagementWindow.id)
    }, [activateWindow, onClaimKeyboardCustody, trackManagementWindow.id])

    const {
        handleHeaderPointerDown,
        handleHeaderPointerMove,
        handleHeaderPointerUp,
    } = useTrackManagementWindowDrag({
        mapContainerRef,
        onMove,
        onActivate: activateWindow,
        onClaimKeyboardCustody,
        windowId: trackManagementWindow.id,
        trackManagementWindowSize,
    })

    const renderKinematicField = (field, label) => (
        <TextField
            key={field}
            label={label}
            size='small'
            type='text'
            inputMode='numeric'
            value={getKinematicFieldDisplayValue(field)}
            onFocus={() => {
                handleFieldFocus(field)
                beginKinematicFieldEdit(field)
            }}
            onChange={(event) => updateKinematicFieldDraft(field, event.target.value)}
            onBlur={() => {
                commitKinematicFieldDraft(field)
                handleFieldBlur(field)
            }}
            slotProps={TEXT_INPUT_ENTER_BLUR_SLOT_PROPS}
            fullWidth
        />
    )

    return (
        <Paper
            ref={setTrackManagementWindowRef}
            data-track-management-window
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={handleWindowPointerDown}
            sx={(theme) => ({
                position: 'absolute',
                ...getTrackManagementWindowPosition(
                    trackManagementWindow,
                    trackManagementWindowSize,
                    mapContainerRef,
                ),
                zIndex,
                width: 300,
                pointerEvents: 'auto',
                userSelect: 'none',
                overflow: 'hidden',
                ...(hasKeyboardCustody && {
                    boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}, ${theme.shadows[8]}`,
                }),
            })}
        >
            <Box
                onPointerDown={handleHeaderPointerDown}
                onPointerMove={handleHeaderPointerMove}
                onPointerUp={handleHeaderPointerUp}
                onPointerCancel={handleHeaderPointerUp}
                sx={{
                    bgcolor: 'primary.main',
                    px: 2,
                    py: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'move',
                    touchAction: 'none',
                }}
            >
                <DragIndicatorIcon
                    sx={{
                        color: 'primary.contrastText',
                        fontSize: '1rem',
                    }}
                />
                <Typography
                    sx={{
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        color: 'primary.contrastText',
                        fontSize: '0.9rem',
                        flexGrow: 1,
                    }}
                >
                    Track Management
                </Typography>
                <IconButton
                    aria-label='Close track management window'
                    size='small'
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                        event.stopPropagation()
                        onClose(trackManagementWindow.id)
                    }}
                    sx={{
                        color: 'primary.contrastText',
                        p: 0.25,
                    }}
                >
                    <CloseIcon fontSize='small'/>
                </IconButton>
            </Box>

            <Stack spacing={1.5} sx={{p: 2}}>
                <Typography sx={{fontWeight: 'bold', fontFamily: 'monospace'}}>
                    Track ID: {trackManagementWindow.trackId}
                </Typography>

                <Box>
                    {formattedCoordinates.map((coordinateLine) => (
                        <Typography
                            key={coordinateLine}
                            sx={{fontFamily: 'monospace', whiteSpace: 'pre', fontSize: '0.8rem'}}
                        >
                            {coordinateLine}
                        </Typography>
                    ))}
                </Box>

                <Divider/>

                <FormControl size='small' fullWidth>
                    <InputLabel id={`${trackManagementWindow.id}-correlation-mode-label`}>
                        Correlation mode
                    </InputLabel>
                    <Select
                        labelId={`${trackManagementWindow.id}-correlation-mode-label`}
                        label='Correlation mode'
                        value={trackManagementWindow.correlationMode ?? TRACK_CORRELATION_MODES.ACTIVE}
                        onChange={(event) => updateField('correlationMode', event.target.value)}
                        onOpen={() => handleFieldFocus('correlationMode')}
                        onClose={() => handleFieldBlur('correlationMode')}
                    >
                        {CORRELATION_MODE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    label='Callsign'
                    size='small'
                    value={displayCallsign}
                    onChange={handleCallsignChange}
                    onFocus={() => handleFieldFocus('callsign')}
                    onBlur={() => {
                        handleCallsignBlur()
                        handleFieldBlur('callsign')
                    }}
                    slotProps={TEXT_INPUT_ENTER_BLUR_SLOT_PROPS}
                    error={Boolean(callsignError)}
                    helperText={callsignError ?? 'Letters and numbers only.'}
                    fullWidth
                />

                <FormControl size='small' fullWidth>
                    <InputLabel id={`${trackManagementWindow.id}-domain-label`}>
                        Domain
                    </InputLabel>
                    <Select
                        labelId={`${trackManagementWindow.id}-domain-label`}
                        label='Domain'
                        value={trackManagementWindow.domain}
                        onChange={(event) => updateField('domain', event.target.value)}
                        onOpen={() => handleFieldFocus('domain')}
                        onClose={() => handleFieldBlur('domain')}
                    >
                        {Object.values(TRACK_DOMAINS).map((domain) => (
                            <MenuItem key={domain} value={domain}>
                                {formatEnumLabel(domain)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size='small' fullWidth>
                    <InputLabel id={`${trackManagementWindow.id}-identity-label`}>
                        Identity
                    </InputLabel>
                    <Select
                        labelId={`${trackManagementWindow.id}-identity-label`}
                        label='Identity'
                        value={trackManagementWindow.identity}
                        onChange={(event) => updateField('identity', event.target.value)}
                        onOpen={() => handleFieldFocus('identity')}
                        onClose={() => handleFieldBlur('identity')}
                    >
                        {TRACK_IDENTITY_OPTIONS.map((identityOption) => (
                            <MenuItem key={identityOption.value} value={identityOption.value}>
                                {identityOption.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <SearchableSelect
                    label='Type'
                    labelId={`${trackManagementWindow.id}-type-label`}
                    value={selectedTrackType}
                    options={availableTrackTypes}
                    onChange={(value) => updateField('type', value)}
                    disabled={availableTrackTypes.length === 0}
                    emptyResultsLabel='No matching types'
                    zIndex={zIndex}
                    onOpen={() => handleFieldFocus('type')}
                    onClose={() => handleFieldBlur('type')}
                />

                <SearchableSelect
                    label='Specific Type'
                    labelId={`${trackManagementWindow.id}-specific-type-label`}
                    value={selectedSpecificType}
                    options={availableSpecificTypes}
                    onChange={(value) => updateField('specificType', value)}
                    emptyResultsLabel='No matching platforms'
                    zIndex={zIndex}
                    onOpen={() => handleFieldFocus('specificType')}
                    onClose={() => handleFieldBlur('specificType')}
                />

                <FormControlLabel
                    control={(
                        <Checkbox
                            checked={Boolean(trackManagementWindow.infoFields)}
                            onChange={(event) => updateField('infoFields', event.target.checked)}
                            onFocus={() => handleFieldFocus('infoFields')}
                            onBlur={() => handleFieldBlur('infoFields')}
                            size='small'
                        />
                    )}
                    label='Show symbol info fields'
                    sx={{m: 0}}
                />

                {renderKinematicField('heading', 'Heading (deg)')}
                {renderKinematicField('speed', 'Speed (kts)')}
                {renderKinematicField('altitude', 'Altitude (ft)')}
            </Stack>
        </Paper>
    )
})

export default TrackManagementWindow
