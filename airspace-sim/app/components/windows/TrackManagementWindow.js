'use client'

import {forwardRef} from 'react'
import {
    Box,
    Button,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import {useAppSettings} from '@/app/contexts/AppSettingsContext'
import {formatCoordinatePairForGridReferenceSystem} from '@/app/tools/formatting/GridReferenceFormatting'
import {
    TRACK_DOMAINS,
    TRACK_IDENTITIES,
    TRACK_TYPES,
} from '@/app/tools/milstd2525/trackSymbolCodes'

function getTrackManagementWindowPosition(trackManagementWindow, mapContainerRef) {
    const edgePadding = 8
    const containerWidth = mapContainerRef.current?.clientWidth ?? window.innerWidth
    const containerHeight = mapContainerRef.current?.clientHeight ?? window.innerHeight
    const windowWidth = 300
    const estimatedWindowHeight = 220

    let left = trackManagementWindow.x
    let top = trackManagementWindow.y

    if (left + windowWidth > containerWidth - edgePadding)
        left = trackManagementWindow.x - windowWidth

    if (top + estimatedWindowHeight > containerHeight - edgePadding)
        top = trackManagementWindow.y - estimatedWindowHeight

    return {
        left: Math.max(edgePadding, left),
        top: Math.max(edgePadding, top),
    }
}

const TRACK_TYPES_BY_DOMAIN = {
    [TRACK_DOMAINS.AIR]: [
        TRACK_TYPES.FIGHTER,
        TRACK_TYPES.TANKER,
        TRACK_TYPES.AWACS,
    ],
    [TRACK_DOMAINS.SURFACE]: [
        TRACK_TYPES.SURFACE_COMBATANT,
    ],
    [TRACK_DOMAINS.SUBSURFACE]: [
        TRACK_TYPES.SUBMARINE,
    ],
    [TRACK_DOMAINS.LAND]: [
        TRACK_TYPES.GROUND_UNIT,
    ],
    [TRACK_DOMAINS.SPACE]: [],
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
                                                                            onClose,
                                                                        }, ref) {
    const {appSettings} = useAppSettings()

    const formattedCoordinates = formatCoordinatePairForGridReferenceSystem(
        trackManagementWindow.lngLat.lat,
        trackManagementWindow.lngLat.lng,
        appSettings.gridReferenceSystem,
    )

    const availableTrackTypes = TRACK_TYPES_BY_DOMAIN[trackManagementWindow.domain] ?? []
    const selectedTrackType = availableTrackTypes.includes(trackManagementWindow.type)
        ? trackManagementWindow.type
        : availableTrackTypes[0] ?? ''

    const updateField = (field, value) => {
        const updates = {
            [field]: value,
        }

        if (field === 'domain') {
            const nextTypes = TRACK_TYPES_BY_DOMAIN[value] ?? []

            updates.type = nextTypes.includes(trackManagementWindow.type)
                ? trackManagementWindow.type
                : nextTypes[0] ?? ''
        }

        onChange(trackManagementWindow.id, updates)
    }

    return (
        <Paper
            ref={ref}
            elevation={8}
            onClick={(event) => event.stopPropagation()}
            sx={{
                position: 'absolute',
                ...getTrackManagementWindowPosition(trackManagementWindow, mapContainerRef),
                zIndex: 10,
                width: 300,
                userSelect: 'none',
                overflow: 'hidden',
            }}
        >
            <Box sx={{bgcolor: 'primary.main', p: 2}}>
                <Typography
                    sx={{
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        color: 'primary.contrastText',
                        fontSize: '0.9rem',
                    }}
                >
                    Track Management
                </Typography>
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
                        {Object.values(TRACK_IDENTITIES).map((identity) => (
                            <MenuItem key={identity} value={identity}>
                                {formatEnumLabel(identity)}
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
                        {availableTrackTypes.map((trackType) => (
                            <MenuItem key={trackType} value={trackType}>
                                {formatEnumLabel(trackType)}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

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

                <Button
                    color='primary'
                    size='small'
                    variant='outlined'
                    onClick={() => onClose(trackManagementWindow.id)}
                    sx={{justifyContent: 'flex-start', fontFamily: 'monospace'}}
                    fullWidth
                >
                    Close
                </Button>
            </Stack>
        </Paper>
    )
})

export default TrackManagementWindow