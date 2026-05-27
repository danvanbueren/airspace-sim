'use client'

import {forwardRef, useCallback, useRef} from 'react'
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
    TRACK_DOMAINS,
    TRACK_IDENTITY_OPTIONS,
    getDefaultTrackTypeForDomain,
    getTrackTypeOption,
    getTrackTypeOptionsForDomain,
} from '@/app/tools/milstd2525/trackSymbolCodes'

function getTrackManagementWindowPosition(trackManagementWindow, trackManagementWindowSize, mapContainerRef) {
    const edgePadding = 8
    const containerWidth = mapContainerRef.current?.clientWidth ?? window.innerWidth
    const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight
    const windowWidth = trackManagementWindowSize.width || 300
    const windowHeight = trackManagementWindowSize.height || 320

    let left = trackManagementWindow.x
    let top = trackManagementWindow.y

    if (left + windowWidth > containerWidth - edgePadding)
        left = trackManagementWindow.x - windowWidth

    if (top + windowHeight > containerHeight - edgePadding)
        top = trackManagementWindow.y - windowHeight

    return {
        left: Math.max(edgePadding, left),
        top: Math.max(edgePadding, top),
    }
}

function getBoundedTrackManagementWindowPosition(left, top, trackManagementWindowSize, mapContainerRef) {
    const edgePadding = 8
    const containerWidth = mapContainerRef.current?.clientWidth ?? window.innerWidth
    const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight
    const windowWidth = trackManagementWindowSize.width || 300
    const windowHeight = trackManagementWindowSize.height || 320
    const maxLeft = Math.max(edgePadding, containerWidth - windowWidth - edgePadding)
    const maxTop = Math.max(edgePadding, containerHeight - windowHeight - edgePadding)

    return {
        x: Math.min(Math.max(edgePadding, left), maxLeft),
        y: Math.min(Math.max(edgePadding, top), maxTop),
    }
}

function formatEnumLabel(value) {
    return value
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (character) => character.toUpperCase())
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
    const dragStateRef = useRef(null)
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

    const handleHeaderPointerDown = useCallback((event) => {
        if (event.button !== 0) {
            return
        }

        event.stopPropagation()
        event.preventDefault()
        activateWindow()
        onClaimKeyboardCustody?.(trackManagementWindow.id)

        const trackManagementWindowElement = trackManagementWindowRef.current
        const mapContainerElement = mapContainerRef.current

        if (!trackManagementWindowElement || !mapContainerElement) {
            return
        }

        const windowRect = trackManagementWindowElement.getBoundingClientRect()
        const containerRect = mapContainerElement.getBoundingClientRect()

        dragStateRef.current = {
            pointerId: event.pointerId,
            offsetX: event.clientX - windowRect.left,
            offsetY: event.clientY - windowRect.top,
            containerLeft: containerRect.left,
            containerTop: containerRect.top,
        }

        event.currentTarget.setPointerCapture?.(event.pointerId)
    }, [activateWindow, mapContainerRef, onClaimKeyboardCustody, trackManagementWindow.id])

    const handleHeaderPointerMove = useCallback((event) => {
        const dragState = dragStateRef.current

        if (!dragState || dragState.pointerId !== event.pointerId) {
            return
        }

        event.preventDefault()

        const left = event.clientX - dragState.containerLeft - dragState.offsetX
        const top = event.clientY - dragState.containerTop - dragState.offsetY

        onMove?.(
            trackManagementWindow.id,
            getBoundedTrackManagementWindowPosition(
                left,
                top,
                trackManagementWindowSize,
                mapContainerRef,
            ),
        )
    }, [mapContainerRef, onMove, trackManagementWindow.id, trackManagementWindowSize])

    const handleHeaderPointerUp = useCallback((event) => {
        if (dragStateRef.current?.pointerId !== event.pointerId) {
            return
        }

        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        dragStateRef.current = null
    }, [])

    return (
        <Paper
            ref={setTrackManagementWindowRef}
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

                <TextField
                    label='Heading'
                    size='small'
                    type='number'
                    value={trackManagementWindow.heading}
                    onChange={(event) => updateField('heading', event.target.value)}
                    slotProps={{
                        htmlInput: {
                            min: 0,
                            max: 359,
                            step: 1,
                        },
                    }}
                    fullWidth
                />

                <TextField
                    label='Speed'
                    size='small'
                    type='number'
                    value={trackManagementWindow.speed}
                    onChange={(event) => updateField('speed', event.target.value)}
                    slotProps={{
                        htmlInput: {
                            min: 0,
                            step: 1,
                        },
                    }}
                    fullWidth
                />

                <TextField
                    label='Altitude'
                    size='small'
                    type='number'
                    value={trackManagementWindow.altitude}
                    onChange={(event) => updateField('altitude', event.target.value)}
                    slotProps={{
                        htmlInput: {
                            step: 1,
                        },
                    }}
                    fullWidth
                />
            </Stack>
        </Paper>
    )
})

export default TrackManagementWindow