'use client'

import {forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
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
import {useMapContainerSize} from '@/app/hooks/map/useMapContainerSize'
import {getMapFloatingWindowMaxHeight} from '@/app/tools/map/mapFloatingWindowLayout'
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
    getTrackTypeOptionsForDomain,
    resolveTrackTypeForDomain,
} from '@/app/tools/milstd2525/trackSymbolCodes'
import {
    getDefaultSpecificTypeForTrackType,
    getSpecificTypeOptionsForTrackType,
    normalizeSpecificType,
} from '@/app/tools/milstd2525/trackSpecificTypes'
import {TRACK_CORRELATION_MODES} from '@/app/simulation/trackFromDetection'
import {expandTrackManagementWindowSkipLiveFields} from '@/app/tools/map/trackManagementTrack'
import AttentionFlagPills from '@/app/components/floating/windows/AttentionFlagPills'
import {getVisibleTrackAttentionFlags} from '@/app/simulation/trackAttentionFlags'
import {
    getMode3DisplayLabel,
    isIffMode3Stale,
} from '@/app/simulation/iffMode3'
import {absoluteToEdgeAnchor} from '@/app/tools/map/edgeAnchoredPosition'
import {TEXT_INPUT_ENTER_BLUR_SLOT_PROPS} from '@/app/tools/ui/textInputSlotProps'
import {isPartialNumericInput} from '@/app/tools/ui/deferredNumericField'
import {
    getLegacyMapClickWindowPosition,
    getTrackManagementWindowPosition,
    useTrackManagementWindowDrag,
} from '@/app/hooks/map/useTrackManagementWindowDrag'

const CORRELATION_MODE_OPTIONS = [
    {value: TRACK_CORRELATION_MODES.ACTIVE, label: 'Active'},
    {value: TRACK_CORRELATION_MODES.EXTRAPOLATED, label: 'Extrapolated'},
    {value: TRACK_CORRELATION_MODES.SUSPEND, label: 'Suspended'},
]

const KINEMATIC_FOCUS_FIELDS = ['heading', 'speed', 'altitude']

const TRACK_MANAGEMENT_MONOSPACE_SX = {
    fontFamily: 'monospace',
    '& .MuiTypography-root': {
        fontFamily: 'monospace',
    },
    '& .MuiInputBase-root': {
        fontFamily: 'monospace',
    },
    '& .MuiInputLabel-root': {
        fontFamily: 'monospace',
    },
    '& .MuiFormHelperText-root': {
        fontFamily: 'monospace',
    },
    '& .MuiFormControlLabel-label': {
        fontFamily: 'monospace',
    },
    '& .MuiSelect-select': {
        fontFamily: 'monospace',
    },
}

function getTrackManagementSelectMenuProps(zIndex) {
    return {
        autoFocus: false,
        disableAutoFocusItem: true,
        slotProps: {
            paper: {
                sx: {
                    maxHeight: 320,
                    zIndex: (zIndex ?? 1300) + 1,
                    fontFamily: 'monospace',
                    '& .MuiMenuItem-root': {
                        fontFamily: 'monospace',
                    },
                    '& .MuiInputBase-root': {
                        fontFamily: 'monospace',
                    },
                    '& .MuiTypography-root': {
                        fontFamily: 'monospace',
                    },
                },
            },
        },
    }
}

function formatEnumLabel(value) {
    return value
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (character) => character.toUpperCase())
}

function isTrackManagementInteractiveTarget(target) {
    if (!(target instanceof Element)) {
        return false
    }

    return Boolean(target.closest(
        'input, textarea, select, button, label, [role="combobox"], [role="listbox"], [role="option"], [role="checkbox"], .MuiInputBase-root, .MuiFormControl-root, .MuiCheckbox-root, .MuiFormControlLabel-root, .MuiIconButton-root',
    ))
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

function isCommittedKinematicFieldUnchanged(field, parsedValue, committedValue) {
    if (field === 'heading') {
        return normalizeHeading(parsedValue) === normalizeHeading(committedValue)
    }

    const normalizedParsed = parsedValue === '' ? null : parsedValue
    const normalizedCommitted = committedValue === '' || committedValue === null || committedValue === undefined
        ? null
        : parseWholeNumberInput(committedValue)

    return normalizedParsed === normalizedCommitted
}

function getKinematicDraftError(field, raw) {
    const trimmed = String(raw ?? '').replaceAll(',', '').trim()

    if (trimmed === '') {
        return null
    }

    if (!isPartialNumericInput(trimmed)) {
        return 'Enter a valid number'
    }

    if (field === 'heading') {
        return null
    }

    const parsed = parseWholeNumberInput(trimmed)

    if (parsed === '') {
        return 'Enter a valid number'
    }

    return null
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
                MenuProps={getTrackManagementSelectMenuProps(zIndex)}
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
                        slotProps={{
                            input: {
                                sx: {fontFamily: 'monospace'},
                            },
                        }}
                    />
                </ListSubheader>
                {filteredOptions.length === 0 ? (
                    <MenuItem disabled dense sx={{opacity: 1, fontFamily: 'monospace'}}>
                        <Typography variant='body2' color='text.secondary'>
                            {emptyResultsLabel}
                        </Typography>
                    </MenuItem>
                ) : (
                    filteredOptions.map((option) => (
                        <MenuItem
                            key={option.value || 'unspecified'}
                            value={option.value}
                            sx={{fontFamily: 'monospace'}}
                        >
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
                                                                            evaluationTime = Date.now(),
                                                                            onChange,
                                                                            onMoveComplete,
                                                                            onActivate,
                                                                            onClaimKeyboardCustody,
                                                                            onClose,
                                                                            onSkipLiveFieldsChange,
                                                                            hasKeyboardCustody = false,
                                                                            zIndex,
                                                                        }, ref) {
    const {appSettings} = useAppSettings()
    const trackManagementWindowRef = useRef(null)
    const mapContainerSize = useMapContainerSize(mapContainerRef)
    const [kinematicFieldDrafts, setKinematicFieldDrafts] = useState({})
    const [kinematicFieldErrors, setKinematicFieldErrors] = useState({})
    const [callsignDraft, setCallsignDraft] = useState(null)
    const [callsignError, setCallsignError] = useState(null)
    const kinematicFieldDraftsRef = useRef({})
    const callsignDraftRef = useRef(null)
    const focusedFieldsRef = useRef(new Set())
    const viewportMaxWindowHeight = getMapFloatingWindowMaxHeight(mapContainerSize.height)
    const trackManagementWindowSize = useMeasuredElementSize(
        trackManagementWindowRef,
        [trackManagementWindow, appSettings.gridReferenceSystem, viewportMaxWindowHeight],
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
        kinematicFieldDraftsRef.current = {}
        callsignDraftRef.current = null
        focusedFieldsRef.current = new Set()
        setKinematicFieldDrafts({})
        setKinematicFieldErrors({})
        setCallsignDraft(null)
        setCallsignError(null)
        onSkipLiveFieldsChange?.(trackManagementWindow.id, new Set())
    }, [onSkipLiveFieldsChange, trackManagementWindow.id])

    const publishSkipLiveFields = useCallback((
        nextFocusedFields = focusedFieldsRef.current,
        nextKinematicDrafts = kinematicFieldDraftsRef.current,
        nextCallsignDraft = callsignDraftRef.current,
    ) => {
        onSkipLiveFieldsChange?.(
            trackManagementWindow.id,
            expandTrackManagementWindowSkipLiveFields(
                nextFocusedFields,
                nextKinematicDrafts,
                nextCallsignDraft,
            ),
        )
    }, [onSkipLiveFieldsChange, trackManagementWindow.id])

    useEffect(() => () => {
        onSkipLiveFieldsChange?.(trackManagementWindow.id, new Set())
    }, [onSkipLiveFieldsChange, trackManagementWindow.id])

    const handleFieldFocus = useCallback((field) => {
        if (focusedFieldsRef.current.has(field)) {
            return
        }

        const nextFocusedFields = new Set(focusedFieldsRef.current)
        nextFocusedFields.add(field)
        focusedFieldsRef.current = nextFocusedFields
        publishSkipLiveFields(nextFocusedFields)
    }, [publishSkipLiveFields])

    const handleFieldBlur = useCallback((field) => {
        if (!focusedFieldsRef.current.has(field)) {
            return
        }

        const nextFocusedFields = new Set(focusedFieldsRef.current)
        nextFocusedFields.delete(field)
        focusedFieldsRef.current = nextFocusedFields
        publishSkipLiveFields(nextFocusedFields)
    }, [publishSkipLiveFields])

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
    const selectedTrackType = resolveTrackTypeForDomain(
        trackManagementWindow.type,
        trackManagementWindow.domain,
    )
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
            updates.type = resolveTrackTypeForDomain(trackManagementWindow.type, value)
            updates.specificType = getDefaultSpecificTypeForTrackType(updates.type)
        }

        if (field === 'type') {
            updates.specificType = getDefaultSpecificTypeForTrackType(value)
        }

        onChange(trackManagementWindow.id, updates)
    }

    const handleKinematicFieldBlur = (field) => {
        const draft = kinematicFieldDraftsRef.current[field]
        const nextDrafts = {...kinematicFieldDraftsRef.current}
        delete nextDrafts[field]

        const nextFocusedFields = new Set(focusedFieldsRef.current)
        nextFocusedFields.delete(field)

        focusedFieldsRef.current = nextFocusedFields
        kinematicFieldDraftsRef.current = nextDrafts
        publishSkipLiveFields(nextFocusedFields, nextDrafts)
        setKinematicFieldDrafts(nextDrafts)

        if (draft === undefined) {
            setKinematicFieldErrors((previous) => {
                const next = {...previous}
                delete next[field]
                return next
            })
            return
        }

        const draftError = getKinematicDraftError(field, draft)

        if (draftError) {
            setKinematicFieldErrors((previous) => ({
                ...previous,
                [field]: draftError,
            }))
            return
        }

        setKinematicFieldErrors((previous) => {
            const next = {...previous}
            delete next[field]
            return next
        })

        const parsedValue = parseCommittedKinematicField(field, draft)

        if (isCommittedKinematicFieldUnchanged(field, parsedValue, trackManagementWindow[field])) {
            return
        }

        updateField(field, parsedValue)
    }

    const blurActiveKinematicFields = (exceptField = null) => {
        for (const field of KINEMATIC_FOCUS_FIELDS) {
            if (field === exceptField) {
                continue
            }

            if (focusedFieldsRef.current.has(field) || field in kinematicFieldDraftsRef.current) {
                handleKinematicFieldBlur(field)
            }
        }
    }

    const handleKinematicFieldFocus = (field) => {
        blurActiveKinematicFields(field)

        const nextFocusedFields = new Set(focusedFieldsRef.current)
        nextFocusedFields.add(field)

        const nextDrafts = {
            ...kinematicFieldDraftsRef.current,
            [field]: getEditableKinematicDraft(field, trackManagementWindow[field]),
        }

        focusedFieldsRef.current = nextFocusedFields
        kinematicFieldDraftsRef.current = nextDrafts
        publishSkipLiveFields(nextFocusedFields, nextDrafts)
        setKinematicFieldDrafts(nextDrafts)
        setKinematicFieldErrors((previous) => {
            const next = {...previous}
            delete next[field]
            return next
        })
    }

    const updateKinematicFieldDraft = (field, rawValue) => {
        const nextDrafts = {
            ...kinematicFieldDraftsRef.current,
            [field]: rawValue,
        }

        kinematicFieldDraftsRef.current = nextDrafts
        setKinematicFieldDrafts(nextDrafts)
        setKinematicFieldErrors((previous) => {
            const error = getKinematicDraftError(field, rawValue)
            const next = {...previous}

            if (error) {
                next[field] = error
            } else {
                delete next[field]
            }

            return next
        })
    }

    const handleSelectOpen = (field) => {
        blurActiveKinematicFields()
        handleFieldFocus(field)
    }

    const handleNonKinematicFieldFocus = (field) => {
        blurActiveKinematicFields()
        handleFieldFocus(field)
    }

    const releaseActiveFieldFocus = () => {
        blurActiveKinematicFields()

        const activeElement = document.activeElement

        if (activeElement instanceof HTMLElement
            && trackManagementWindowRef.current?.contains(activeElement)) {
            activeElement.blur()
        }
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

        callsignDraftRef.current = sanitized
        publishSkipLiveFields(focusedFieldsRef.current, kinematicFieldDraftsRef.current, sanitized)
        setCallsignDraft(sanitized)
        setCallsignError(error)
    }

    const handleCallsignFocus = () => {
        handleNonKinematicFieldFocus('callsign')

        const initial = trackManagementWindow.callsign

        callsignDraftRef.current = initial
        publishSkipLiveFields(focusedFieldsRef.current, kinematicFieldDraftsRef.current, initial)
        setCallsignDraft(initial)
        setCallsignError(null)
    }

    const handleCallsignBlur = () => {
        const sanitized = callsignDraftRef.current ?? trackManagementWindow.callsign
        const error = getCallsignValidationError(
            sanitized,
            tracksForCallsignValidation,
            trackManagementWindow.trackId,
        )

        callsignDraftRef.current = null
        publishSkipLiveFields(focusedFieldsRef.current, kinematicFieldDraftsRef.current, null)
        setCallsignDraft(null)
        setCallsignError(null)

        if (!error && sanitized !== trackManagementWindow.callsign) {
            updateField('callsign', sanitized)
        }

        handleFieldBlur('callsign')
    }

    const displayCallsign = callsignDraft ?? trackManagementWindow.callsign
    const visibleAttentionFlags = getVisibleTrackAttentionFlags(
        {
            ...trackManagementWindow,
            attentionFlags: trackManagementWindow.attentionFlags ?? [],
        },
        evaluationTime,
        appSettings.inhibitedAttentions ?? [],
        appSettings.iffRefreshMs ?? 1000,
    )
    const iffMode3Stale = Boolean(
        trackManagementWindow.iffMode3Code
        && isIffMode3Stale(
            trackManagementWindow,
            evaluationTime,
            appSettings.iffRefreshMs ?? 1000,
        ),
    )
    const iffMode3Display = trackManagementWindow.iffMode3Code
        ? getMode3DisplayLabel(trackManagementWindow.iffMode3Code)
        : '—'

    const activateWindow = useCallback(() => {
        if (trackManagementWindow.dismissOnMapClick) {
            onActivate?.(trackManagementWindow.id)
        }
    }, [onActivate, trackManagementWindow.dismissOnMapClick, trackManagementWindow.id])

    const handleWindowPointerDown = (event) => {
        event.stopPropagation()

        if (!isTrackManagementInteractiveTarget(event.target)) {
            releaseActiveFieldFocus()
        }

        activateWindow()
        onClaimKeyboardCustody?.(trackManagementWindow.id)
    }

    const {
        dragPosition,
        handleHeaderPointerDown,
        handleHeaderPointerMove,
        handleHeaderPointerUp,
    } = useTrackManagementWindowDrag({
        mapContainerRef,
        onMoveComplete,
        onActivate: activateWindow,
        onClaimKeyboardCustody,
        windowId: trackManagementWindow.id,
        trackManagementWindowSize,
    })

    useLayoutEffect(() => {
        if (trackManagementWindow.positionAnchor) {
            return
        }

        if (!trackManagementWindowSize.width || !trackManagementWindowSize.height) {
            return
        }

        const legacyPosition = getLegacyMapClickWindowPosition(
            trackManagementWindow,
            trackManagementWindowSize,
            mapContainerRef,
        )
        const containerSize = {
            width: mapContainerRef.current?.clientWidth ?? window.innerWidth,
            height: mapContainerRef.current?.clientHeight ?? window.innerHeight,
        }

        onMoveComplete?.(
            trackManagementWindow.id,
            absoluteToEdgeAnchor(
                legacyPosition.left,
                legacyPosition.top,
                containerSize,
                {
                    width: trackManagementWindowSize.width,
                    height: trackManagementWindowSize.height,
                },
            ),
        )
    }, [
        mapContainerRef,
        onMoveComplete,
        trackManagementWindow.id,
        trackManagementWindow.positionAnchor,
        trackManagementWindow.x,
        trackManagementWindow.y,
        trackManagementWindowSize,
    ])

    const windowPosition = dragPosition
        ? {left: dragPosition.x, top: dragPosition.y}
        : getTrackManagementWindowPosition(
            trackManagementWindow,
            trackManagementWindowSize,
            mapContainerRef,
        )

    const renderKinematicField = (field, label) => (
        <TextField
            key={field}
            label={label}
            size='small'
            type='text'
            inputMode='numeric'
            value={getKinematicFieldDisplayValue(field)}
            onFocus={() => {
                handleKinematicFieldFocus(field)
            }}
            onChange={(event) => updateKinematicFieldDraft(field, event.target.value)}
            onBlur={() => {
                handleKinematicFieldBlur(field)
            }}
            slotProps={TEXT_INPUT_ENTER_BLUR_SLOT_PROPS}
            error={Boolean(kinematicFieldErrors[field])}
            helperText={kinematicFieldErrors[field]}
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
                ...windowPosition,
                zIndex,
                width: 300,
                maxHeight: viewportMaxWindowHeight,
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
                userSelect: 'none',
                overflow: 'hidden',
                ...TRACK_MANAGEMENT_MONOSPACE_SX,
                ...(hasKeyboardCustody && {
                    boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}, ${theme.shadows[8]}`,
                }),
            })}
        >
            <Box
                onPointerDown={(event) => {
                    releaseActiveFieldFocus()
                    handleHeaderPointerDown(event)
                }}
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
                    flexShrink: 0,
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

            <Box
                sx={{
                    overflowY: 'auto',
                    flex: '1 1 auto',
                    minHeight: 0,
                }}
            >
            <Stack spacing={1.5} sx={{p: 2}}>
                <Typography sx={{fontWeight: 'bold'}}>
                    Track ID: {trackManagementWindow.trackId}
                </Typography>

                <Box>
                    {formattedCoordinates.map((coordinateLine) => (
                        <Typography
                            key={coordinateLine}
                            sx={{whiteSpace: 'pre', fontSize: '0.8rem'}}
                        >
                            {coordinateLine}
                        </Typography>
                    ))}
                </Box>

                <Divider/>

                <Box>
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            mb: 0.75,
                        }}
                    >
                        Attention Flags
                    </Typography>
                    {visibleAttentionFlags.length > 0 ? (
                        <AttentionFlagPills flagIds={visibleAttentionFlags} dense/>
                    ) : (
                        <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{fontSize: '0.75rem'}}
                        >
                            None
                        </Typography>
                    )}
                </Box>

                <Divider/>

                <Box>
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            mb: 0.75,
                        }}
                    >
                        IFF Mode 3
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '0.8rem',
                                color: iffMode3Stale ? 'text.disabled' : 'text.primary',
                            }}
                        >
                            {iffMode3Display}
                        </Typography>
                        {iffMode3Stale ? (
                            <AttentionFlagPills flagIds={['IFF_STALE']} dense/>
                        ) : null}
                    </Box>
                    {!trackManagementWindow.iffMode3Code ? (
                        <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{fontSize: '0.75rem', mt: 0.5}}
                        >
                            No correlated IFF return
                        </Typography>
                    ) : null}
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
                        onOpen={() => handleSelectOpen('correlationMode')}
                        onClose={() => handleFieldBlur('correlationMode')}
                        MenuProps={getTrackManagementSelectMenuProps(zIndex)}
                    >
                        {CORRELATION_MODE_OPTIONS.map((option) => (
                            <MenuItem
                                key={option.value}
                                value={option.value}
                                sx={{fontFamily: 'monospace'}}
                            >
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
                    onFocus={handleCallsignFocus}
                    onBlur={handleCallsignBlur}
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
                        onOpen={() => handleSelectOpen('domain')}
                        onClose={() => handleFieldBlur('domain')}
                        MenuProps={getTrackManagementSelectMenuProps(zIndex)}
                    >
                        {Object.values(TRACK_DOMAINS).map((domain) => (
                            <MenuItem
                                key={domain}
                                value={domain}
                                sx={{fontFamily: 'monospace'}}
                            >
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
                        onOpen={() => handleSelectOpen('identity')}
                        onClose={() => handleFieldBlur('identity')}
                        MenuProps={getTrackManagementSelectMenuProps(zIndex)}
                    >
                        {TRACK_IDENTITY_OPTIONS.map((identityOption) => (
                            <MenuItem
                                key={identityOption.value}
                                value={identityOption.value}
                                sx={{fontFamily: 'monospace'}}
                            >
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
                    onOpen={() => handleSelectOpen('type')}
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
                    onOpen={() => handleSelectOpen('specificType')}
                    onClose={() => handleFieldBlur('specificType')}
                />

                <FormControlLabel
                    control={(
                        <Checkbox
                            checked={Boolean(trackManagementWindow.infoFields)}
                            onChange={(event) => updateField('infoFields', event.target.checked)}
                            onFocus={() => handleNonKinematicFieldFocus('infoFields')}
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
            </Box>
        </Paper>
    )
})

export default TrackManagementWindow
