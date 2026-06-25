'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import {
    Alert, Box, Button, Chip, Divider, FormControl, InputLabel, MenuItem, Select, Slider, Stack, TextField, Typography,
} from '@mui/material'
import {
    MOUSE_BUTTONS, useControlBindings,
} from '../../../../../contexts/ControlBindingsContext'
import SettingsModalRestoreDefaultsSection from '../SettingsModalRestoreDefaultsSection'

const KEYBOARD_BINDINGS = [{
    key: 'panUp', label: 'Pan North', description: 'Moves the map camera north.',
}, {
    key: 'panRight', label: 'Pan East', description: 'Moves the map camera east.',
}, {
    key: 'panDown', label: 'Pan South', description: 'Moves the map camera south.',
}, {
    key: 'panLeft', label: 'Pan West', description: 'Moves the map camera west.',
}, {
    key: 'panSpeedModifier',
    label: 'Pan Speed Modifier',
    description: 'Hold this key to modify camera pan speed.',
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
                        Slow Pan Speed
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
                Line/Context Menu Detection Sensitivity
            </Typography>

            <Box
                sx={{
                    display: 'grid', gridTemplateColumns: {
                        xs: '1fr', md: '1fr 1fr 1fr',
                    }, gap: 2,
                }}
            >
                <TextField
                    label='Context Menu Max Timeout'
                    type='number'
                    value={bearingRangeTool.contextMenuMaxMs}
                    onChange={(event) => updateBearingRangeBinding('contextMenuMaxMs', event.target.value)}
                    slotProps={{
                        htmlInput: {
                            min: 0,
                        },
                    }}
                    helperText='Milliseconds'
                    fullWidth
                />

                <TextField
                    label='Context Menu Max Movement'
                    type='number'
                    value={bearingRangeTool.contextMenuMaxPixels}
                    onChange={(event) => updateBearingRangeBinding('contextMenuMaxPixels', event.target.value)}
                    slotProps={{
                        htmlInput: {
                            min: 0,
                        },
                    }}
                    helperText='Pixels'
                    fullWidth
                />

                <TextField
                    label='Minimum Line Length'
                    type='number'
                    value={bearingRangeTool.minPersistedLinePixels}
                    onChange={(event) => updateBearingRangeBinding('minPersistedLinePixels', event.target.value)}
                    slotProps={{
                        htmlInput: {
                            min: 0,
                        },
                    }}
                    helperText='Pixels'
                    fullWidth
                />
            </Box>
        </Stack>

        <SettingsModalRestoreDefaultsSection
            label='Restore Default Keybinds'
            hint='Resets every keyboard, mouse, and sensitivity binding on this page. Settings on other tabs stay exactly as you left them.'
            onClick={handleResetDefaults}
        />
    </Box>)
}