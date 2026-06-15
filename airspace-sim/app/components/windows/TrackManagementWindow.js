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
    TRACK_DOMAINS,
    TRACK_IDENTITY_OPTIONS,
    getDefaultTrackTypeForDomain,
    getTrackTypeOption,
    getTrackTypeOptionsForDomain,
} from '@/app/tools/milstd2525/trackSymbolCodes'
import {TRACK_CORRELATION_MODES} from '@/app/simulation/trackFromDetection'
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

const TrackManagementWindow = forwardRef(function TrackManagementWindow({
                                                                            trackManagementWindow,
                                                                            mapContainerRef,
                                                                            onChange,
                                                                            onMove,
                                                                            onActivate,
                                                                            onClaimKeyboardCustody,
                                                                            onClose,
                                                                            hasKeyboardCustody = false,
                                                                            zIndex,
                                                                        }, ref) {
    const {appSettings} = useAppSettings()
    const trackManagementWindowRef = useRef(null)
    const [kinematicFieldDrafts, setKinematicFieldDrafts] = useState({})
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
    }, [trackManagementWindow.id])

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

    const updateField = (field, value) => {
        const updates = {
            [field]: value,
        }

        if (field === 'domain') {
            const existingTypeOption = getTrackTypeOption(trackManagementWindow.type, value)

            updates.type = existingTypeOption?.value ?? getDefaultTrackTypeForDomain(value)
        }

        onChange(trackManagementWindow.id, updates)
    }

    const beginKinematicFieldEdit = (field) => {
        setKinematicFieldDrafts((currentDrafts) => ({
            ...currentDrafts,
            [field]: getEditableKinematicDraft(field, trackManagementWindow[field]),
        }))
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

        setKinematicFieldDrafts((currentDrafts) => {
            const nextDrafts = {...currentDrafts}
            delete nextDrafts[field]
            return nextDrafts
        })

        updateField(field, parseCommittedKinematicField(field, draft))
    }

    const getKinematicFieldDisplayValue = (field) => {
        const draft = kinematicFieldDrafts[field]

        if (draft !== undefined) {
            return draft
        }

        return getCommittedKinematicDisplay(field, trackManagementWindow[field])
    }

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
            onFocus={() => beginKinematicFieldEdit(field)}
            onChange={(event) => updateKinematicFieldDraft(field, event.target.value)}
            onBlur={() => commitKinematicFieldDraft(field)}
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
                    value={trackManagementWindow.callsign}
                    onChange={(event) => updateField('callsign', event.target.value)}
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
                    >
                        {TRACK_IDENTITY_OPTIONS.map((identityOption) => (
                            <MenuItem key={identityOption.value} value={identityOption.value}>
                                {identityOption.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl size='small' fullWidth disabled={availableTrackTypes.length === 0}>
                    <InputLabel id={`${trackManagementWindow.id}-type-label`}>
                        Type
                    </InputLabel>
                    <Select
                        labelId={`${trackManagementWindow.id}-type-label`}
                        label='Type'
                        value={selectedTrackType}
                        onChange={(event) => updateField('type', event.target.value)}
                    >
                        {availableTrackTypes.map((trackTypeOption) => (
                            <MenuItem key={trackTypeOption.value} value={trackTypeOption.value}>
                                {trackTypeOption.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControlLabel
                    control={(
                        <Checkbox
                            checked={Boolean(trackManagementWindow.infoFields)}
                            onChange={(event) => updateField('infoFields', event.target.checked)}
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
