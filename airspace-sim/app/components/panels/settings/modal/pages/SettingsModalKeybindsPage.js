'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import {
    Alert, Box, Button, Chip, Divider, FormControl, InputLabel, MenuItem, Select, Slider, Stack, Typography,
} from '@mui/material'
import {
    MOUSE_BUTTONS, useControlBindings,
} from '../../../../../contexts/ControlBindingsContext'
import SettingsModalRestoreDefaultsSection from '../SettingsModalRestoreDefaultsSection'
import DeferredTextField from '@/app/components/global/DeferredTextField'
import {createDeferredNumericFieldConfig} from '@/app/tools/ui/deferredNumericField'

const KEYBINDS_SENSITIVITY_FIELDS = [
    {
        key: 'contextMenuMaxMs',
        label: 'Context Menu Timeout',
        helperText: 'Milliseconds',
        ...createDeferredNumericFieldConfig({min: 0, integer: true}),
    },
    {
        key: 'contextMenuMaxPixels',
        label: 'Context Menu Movement Limit',
        helperText: 'Pixels',
        ...createDeferredNumericFieldConfig({min: 0, integer: true}),
    },
    {
        key: 'minPersistedLinePixels',
        label: 'Minimum Line Length',
        helperText: 'Pixels',
        ...createDeferredNumericFieldConfig({min: 0, integer: true}),
    },
]

const KEYBOARD_BINDINGS = [{
    key: 'panUp', label: 'Pan North', description: 'Pan the map north.',
}, {
    key: 'panRight', label: 'Pan East', description: 'Pan the map east.',
}, {
    key: 'panDown', label: 'Pan South', description: 'Pan the map south.',
}, {
    key: 'panLeft', label: 'Pan West', description: 'Pan the map west.',
}, {
    key: 'panSpeedModifier',
    label: 'Speed Modifier Key',
    description: 'Hold while panning to apply the speed modifier below.',
},]

const MOUSE_BUTTON_OPTIONS = [{
    label: 'Left Mouse', value: MOUSE_BUTTONS.left,
}, {
    label: 'Middle Mouse', value: MOUSE_BUTTONS.middle,
}, {
    label: 'Right Mouse', value: MOUSE_BUTTONS.right,
},]

function formatKeyName(key) {
    if (!key) return 'Unbound'

    const labels = {
        ' ': 'Space',
        arrowup: 'Arrow Up',
        arrowleft: 'Arrow Left',
        arrowdown: 'Arrow Down',
        arrowright: 'Arrow Right',
        escape: 'Escape',
        shift: 'Shift',
        control: 'Control',
        alt: 'Alt',
        meta: 'Meta',
    }

    return labels[key.toLowerCase()] ?? key.toUpperCase()
}

function getMouseButtonLabel(value) {
    return MOUSE_BUTTON_OPTIONS.find((option) => option.value === value)?.label ?? `Button ${value}`
}

function normalizeCapturedKey(event) {
    const key = event.key.toLowerCase()

    if (key === ' ') return ' '
    if (key === 'esc') return 'escape'

    return key
}

function toFiniteNumber(value, fallbackValue) {
    const numericValue = Array.isArray(value) ? value[0] : value
    const parsed = Number(numericValue)
    return Number.isFinite(parsed) ? parsed : fallbackValue
}

export default function SettingsModalKeybindsPage() {
    const {
        controlBindings, updateControlBindings, resetControlBindings,
    } = useControlBindings()

    const [listeningForBinding, setListeningForBinding] = useState(null)

    const keyboardCamera = controlBindings.keyboardCamera
    const mapCursor = controlBindings.mapCursor
    const bearingRangeTool = controlBindings.bearingRangeTool

    const updateKeyboardCameraBinding = useCallback((bindingKey, nextValue) => {
        updateControlBindings((currentBindings) => ({
            ...currentBindings, keyboardCamera: {
                ...currentBindings.keyboardCamera, [bindingKey]: [nextValue],
            },
        }))
    }, [updateControlBindings])

    const updateKeyboardCameraNumber = useCallback((bindingKey, nextValue) => {
        updateControlBindings((currentBindings) => ({
            ...currentBindings, keyboardCamera: {
                ...currentBindings.keyboardCamera,
                [bindingKey]: toFiniteNumber(nextValue, currentBindings.keyboardCamera[bindingKey]),
            },
        }))
    }, [updateControlBindings])

    const updateBearingRangeBinding = useCallback((bindingKey, nextValue) => {
        updateControlBindings((currentBindings) => ({
            ...currentBindings, bearingRangeTool: {
                ...currentBindings.bearingRangeTool,
                [bindingKey]: toFiniteNumber(nextValue, currentBindings.bearingRangeTool[bindingKey]),
            },
        }))
    }, [updateControlBindings])

    const updateMapCursorBinding = useCallback((bindingKey, nextValue) => {
        updateControlBindings((currentBindings) => ({
            ...currentBindings, mapCursor: {
                ...currentBindings.mapCursor,
                [bindingKey]: toFiniteNumber(nextValue, currentBindings.mapCursor[bindingKey]),
            },
        }))
    }, [updateControlBindings])

    const handleCaptureKey = useCallback((event, bindingKey) => {
        event.preventDefault()
        event.stopPropagation()

        const nextKey = normalizeCapturedKey(event)

        updateKeyboardCameraBinding(bindingKey, nextKey)
        setListeningForBinding(null)
    }, [updateKeyboardCameraBinding])

    useEffect(() => {
        if (!listeningForBinding) return

        const handleKeyDown = (event) => {
            handleCaptureKey(event, listeningForBinding)
        }

        document.addEventListener('keydown', handleKeyDown, true)

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true)
        }
    }, [listeningForBinding, handleCaptureKey])

    const handleResetDefaults = useCallback(() => {
        resetControlBindings()
        setListeningForBinding(null)
    }, [resetControlBindings])

    const currentListeningLabel = useMemo(() => {
        if (!listeningForBinding) return null

        return KEYBOARD_BINDINGS.find((binding) => binding.key === listeningForBinding)?.label
    }, [listeningForBinding])

    return (<Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
        <Stack spacing={1}>
            <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                Keyboard Camera Controls
            </Typography>
            <Typography variant='body2' color='text.secondary'>
                Click a binding, then press the key you want to assign.
            </Typography>
        </Stack>

        <Stack spacing={2}>
            {KEYBOARD_BINDINGS.map((binding) => {
                const currentKey = keyboardCamera[binding.key]?.[0]
                const isListening = listeningForBinding === binding.key

                return (<Box
                    key={binding.key}
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr', md: '1fr auto',
                        },
                        gap: 2,
                        alignItems: 'center',
                        border: 1,
                        borderColor: isListening ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        p: 2,
                    }}
                >
                    <Box>
                        <Typography sx={{fontWeight: 'bold'}}>
                            {binding.label}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                            {binding.description}
                        </Typography>
                    </Box>

                    <Button
                        variant={isListening ? 'contained' : 'outlined'}
                        onClick={() => setListeningForBinding(binding.key)}
                        sx={{
                            minWidth: 150, justifySelf: {
                                xs: 'stretch', md: 'end',
                            },
                        }}
                    >
                        {isListening ? 'Press Key...' : formatKeyName(currentKey)}
                    </Button>

                    {isListening && currentListeningLabel && (
                        <Alert
                            severity='info'
                            sx={{
                                gridColumn: '1 / -1',
                            }}
                        >
                            Listening for new keybind: <strong>{currentListeningLabel}</strong>
                        </Alert>
                    )}
                </Box>)
            })}
        </Stack>

        <Divider/>

        <Stack spacing={2}>
            <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                Camera Speed
            </Typography>

            <Box>
                <Stack direction='row' sx={{justifyContent: 'space-between', alignItems: 'center'}}>
                    <Typography sx={{fontWeight: 'bold'}}>
                        Pan Speed
                    </Typography>
                    <Chip label={`${keyboardCamera.regularPanSpeed} px/sec`} size='small'/>
                </Stack>
                <Slider
                    value={keyboardCamera.regularPanSpeed}
                    min={250}
                    max={5000}
                    step={50}
                    onChange={(_, value) => updateKeyboardCameraNumber('regularPanSpeed', value)}
                />
            </Box>

            <Box>
                <Stack direction='row' sx={{justifyContent: 'space-between', alignItems: 'center'}}>
                    <Typography sx={{fontWeight: 'bold'}}>
                        Speed Modifier
                    </Typography>
                    <Chip label={`${keyboardCamera.panSpeedMultiplier}x`} size='small'/>
                </Stack>
                <Slider
                    value={keyboardCamera.panSpeedMultiplier}
                    min={0.05}
                    max={5.0}
                    step={0.05}
                    onChange={(_, value) => updateKeyboardCameraNumber('panSpeedMultiplier', value)}
                />
            </Box>
        </Stack>

        <Divider/>

        <Stack spacing={2}>
            <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                Mouse Controls
            </Typography>

            <Box
                sx={{
                    display: 'grid', gridTemplateColumns: {
                        xs: '1fr', md: '1fr 1fr',
                    }, gap: 2, pb: '0.5rem'
                }}
            >
                <FormControl fullWidth>
                    <InputLabel id='map-drag-button-label'>
                        Map Drag Button
                    </InputLabel>
                    <Select
                        labelId='map-drag-button-label'
                        label='Map Drag Button'
                        value={mapCursor.dragButton}
                        onChange={(event) => updateMapCursorBinding('dragButton', event.target.value)}
                        variant='outlined'
                    >
                        {MOUSE_BUTTON_OPTIONS.map((option) => (<MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id='bearing-range-draw-button-label'>
                        Bearing/Range Draw Button
                    </InputLabel>
                    <Select
                        labelId='bearing-range-draw-button-label'
                        label='Bearing/Range Draw Button'
                        value={bearingRangeTool.drawButton}
                        onChange={(event) => updateBearingRangeBinding('drawButton', event.target.value)}
                        variant='outlined'
                    >
                        {MOUSE_BUTTON_OPTIONS.map((option) => (<MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id='bearing-range-context-menu-button-label'>
                        Context Menu Button
                    </InputLabel>
                    <Select
                        labelId='bearing-range-context-menu-button-label'
                        label='Context Menu Button'
                        value={bearingRangeTool.contextMenuButton}
                        onChange={(event) => updateBearingRangeBinding('contextMenuButton', event.target.value)}
                        variant='outlined'
                    >
                        {MOUSE_BUTTON_OPTIONS.map((option) => (<MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>))}
                    </Select>
                </FormControl>
            </Box>

            <Divider/>

            <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                Line and Context Menu Sensitivity
            </Typography>

            <Box
                sx={{
                    display: 'grid', gridTemplateColumns: {
                        xs: '1fr', md: '1fr 1fr 1fr',
                    }, gap: 2,
                }}
            >
                {KEYBINDS_SENSITIVITY_FIELDS.map((field) => (
                    <DeferredTextField
                        key={field.key}
                        label={field.label}
                        type='text'
                        inputMode='numeric'
                        committedValue={bearingRangeTool[field.key]}
                        onCommit={(value) => updateBearingRangeBinding(field.key, value)}
                        formatCommitted={field.formatCommitted}
                        getDraftError={field.getDraftError}
                        parseDraft={field.parseDraft}
                        helperText={field.helperText}
                        fullWidth
                    />
                ))}
            </Box>
        </Stack>

        <SettingsModalRestoreDefaultsSection
            label='Restore Default Keybinds'
            hint='Resets all keybinds and mouse settings on this page. Other tabs are unchanged.'
            onClick={handleResetDefaults}
        />
    </Box>)
}