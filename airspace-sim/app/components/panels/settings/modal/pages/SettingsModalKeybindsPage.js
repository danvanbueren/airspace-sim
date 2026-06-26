'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import {
    Alert, Box, Button, Chip, Divider, FormControl, IconButton, InputLabel, Link, MenuItem, Select, Slider, Stack, Tooltip, Typography,
} from '@mui/material'
import {
    MOUSE_BUTTONS, useControlBindings,
} from '../../../../../contexts/ControlBindingsContext'
import {BEARING_RANGE_BEHAVIOR_MODES, useAppSettings} from '../../../../../contexts/AppSettingsContext'
import SettingsModalPageRestoreFooter from '../SettingsModalPageRestoreFooter'
import DeferredTextField from '@/app/components/global/DeferredTextField'
import {createDeferredNumericFieldConfig} from '@/app/tools/ui/deferredNumericField'
import {buildControlReference} from '@/app/tools/settings/controlReference'
import {bearingRangeBehaviorUsesPersistModifier} from '@/app/tools/map/bearingRangeBehavior'
import {SETTINGS_PAGE_TITLES} from '../../settingsPageConfig'

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
}, {
    key: 'centerMap',
    label: 'Center Map',
    description: 'Center the camera on the cursor position without changing zoom. Leave unbound to use only the mouse button below.',
},]

const BEARING_RANGE_KEYBOARD_BINDINGS = [{
    key: 'persistModifier',
    label: 'Persist Line Modifier',
    description: 'Hold while releasing a bearing/range draw to keep the line on the map. Without this key, lines disappear when the draw button is released.',
},]

const MOUSE_BUTTON_OPTIONS = [{
    label: 'Unbound', value: MOUSE_BUTTONS.unbound,
}, {
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

function normalizeMouseButtonValue(value) {
    const parsed = Number(value)

    return MOUSE_BUTTON_OPTIONS.some((option) => option.value === parsed)
        ? parsed
        : MOUSE_BUTTONS.unbound
}

function getMouseButtonLabel(value) {
    return MOUSE_BUTTON_OPTIONS.find((option) => option.value === normalizeMouseButtonValue(value))?.label ?? 'Unbound'
}

function normalizeCapturedKey(event) {
    const key = event.key.toLowerCase()

    if (key === ' ') return ' '
    if (key === 'esc') return 'escape'
    if (key === 'shift' || key === 'control' || key === 'alt' || key === 'meta') {
        return key
    }

    return key
}

function parseBindingTarget(bindingTarget) {
    if (!bindingTarget) {
        return null
    }

    const [section, bindingKey] = bindingTarget.split(':')

    if (!section || !bindingKey) {
        return null
    }

    return {section, bindingKey}
}

function toFiniteNumber(value, fallbackValue) {
    const numericValue = Array.isArray(value) ? value[0] : value
    const parsed = Number(numericValue)
    return Number.isFinite(parsed) ? parsed : fallbackValue
}

export default function SettingsModalKeybindsPage({onOpenSettingsPage}) {
    const {
        controlBindings, updateControlBindings, resetControlBindings, clearAllControlBindings,
    } = useControlBindings()
    const {appSettings} = useAppSettings()

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

    const updateBearingRangeKeyboardBinding = useCallback((bindingKey, nextValue) => {
        updateControlBindings((currentBindings) => ({
            ...currentBindings, bearingRangeTool: {
                ...currentBindings.bearingRangeTool,
                [bindingKey]: [nextValue],
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

    const handleCaptureKey = useCallback((event, bindingTarget) => {
        event.preventDefault()
        event.stopPropagation()

        const parsedTarget = parseBindingTarget(bindingTarget)

        if (!parsedTarget) {
            return
        }

        const nextKey = normalizeCapturedKey(event)

        if (parsedTarget.section === 'keyboardCamera') {
            updateKeyboardCameraBinding(parsedTarget.bindingKey, nextKey)
        } else if (parsedTarget.section === 'bearingRangeTool') {
            updateBearingRangeKeyboardBinding(parsedTarget.bindingKey, nextKey)
        }

        setListeningForBinding(null)
    }, [updateKeyboardCameraBinding, updateBearingRangeKeyboardBinding])

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

    const handleUnbindAll = useCallback(() => {
        clearAllControlBindings()
        setListeningForBinding(null)
    }, [clearAllControlBindings])

    const currentListeningLabel = useMemo(() => {
        if (!listeningForBinding) return null

        const parsedTarget = parseBindingTarget(listeningForBinding)

        if (!parsedTarget) {
            return null
        }

        if (parsedTarget.section === 'keyboardCamera') {
            return KEYBOARD_BINDINGS.find((binding) => binding.key === parsedTarget.bindingKey)?.label
        }

        if (parsedTarget.section === 'bearingRangeTool') {
            return BEARING_RANGE_KEYBOARD_BINDINGS.find((binding) => binding.key === parsedTarget.bindingKey)?.label
        }

        return null
    }, [listeningForBinding])

    const controlReferenceSections = useMemo(
        () => buildControlReference(controlBindings, {
            bearingRangeBehavior: appSettings.bearingRangeBehavior,
        }),
        [controlBindings, appSettings.bearingRangeBehavior],
    )

    const persistModifierInactive = !bearingRangeBehaviorUsesPersistModifier(appSettings.bearingRangeBehavior)
    const activeBehaviorLabel = BEARING_RANGE_BEHAVIOR_MODES[appSettings.bearingRangeBehavior]?.label
        ?? BEARING_RANGE_BEHAVIOR_MODES.temporary_default.label

    return (<Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
        <Stack direction='row' sx={{justifyContent: 'space-between', alignItems: 'flex-start', gap: 2}}>
            <Stack spacing={1} sx={{flex: 1}}>
                <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                    Keyboard Camera Controls
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Click a binding, then press the key you want to assign.
                </Typography>
            </Stack>
            <Tooltip title='Unbind all keybinds'>
                <IconButton
                    aria-label='Unbind all keybinds'
                    onClick={handleUnbindAll}
                    sx={{mt: -0.5}}
                >
                    <DeleteIcon/>
                </IconButton>
            </Tooltip>
        </Stack>

        <Stack spacing={2}>
            {KEYBOARD_BINDINGS.map((binding) => {
                const currentKey = keyboardCamera[binding.key]?.[0]
                const bindingTarget = `keyboardCamera:${binding.key}`
                const isListening = listeningForBinding === bindingTarget

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
                        onClick={() => setListeningForBinding(bindingTarget)}
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
            <Stack spacing={1}>
                <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                    Mouse Controls
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Choose a mouse button for each action, or select Unbound to disable it.
                </Typography>
            </Stack>

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
                        value={normalizeMouseButtonValue(mapCursor.dragButton)}
                        renderValue={(selected) => getMouseButtonLabel(selected)}
                        onChange={(event) => updateMapCursorBinding('dragButton', normalizeMouseButtonValue(event.target.value))}
                        variant='outlined'
                    >
                        {MOUSE_BUTTON_OPTIONS.map((option) => (<MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id='map-center-button-label'>
                        Center Map Button
                    </InputLabel>
                    <Select
                        labelId='map-center-button-label'
                        label='Center Map Button'
                        value={normalizeMouseButtonValue(mapCursor.centerButton)}
                        renderValue={(selected) => getMouseButtonLabel(selected)}
                        onChange={(event) => updateMapCursorBinding('centerButton', normalizeMouseButtonValue(event.target.value))}
                        variant='outlined'
                    >
                        {MOUSE_BUTTON_OPTIONS.map((option) => (<MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id='map-grab-button-label'>
                        Track Select Button
                    </InputLabel>
                    <Select
                        labelId='map-grab-button-label'
                        label='Track Select Button'
                        value={normalizeMouseButtonValue(mapCursor.grabButton)}
                        renderValue={(selected) => getMouseButtonLabel(selected)}
                        onChange={(event) => updateMapCursorBinding('grabButton', normalizeMouseButtonValue(event.target.value))}
                        variant='outlined'
                    >
                        {MOUSE_BUTTON_OPTIONS.map((option) => (<MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id='map-pointer-button-label'>
                        Pointer Cursor Button
                    </InputLabel>
                    <Select
                        labelId='map-pointer-button-label'
                        label='Pointer Cursor Button'
                        value={normalizeMouseButtonValue(mapCursor.pointerButton)}
                        renderValue={(selected) => getMouseButtonLabel(selected)}
                        onChange={(event) => updateMapCursorBinding('pointerButton', normalizeMouseButtonValue(event.target.value))}
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
                        value={normalizeMouseButtonValue(bearingRangeTool.drawButton)}
                        renderValue={(selected) => getMouseButtonLabel(selected)}
                        onChange={(event) => updateBearingRangeBinding('drawButton', normalizeMouseButtonValue(event.target.value))}
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
                        value={normalizeMouseButtonValue(bearingRangeTool.contextMenuButton)}
                        renderValue={(selected) => getMouseButtonLabel(selected)}
                        onChange={(event) => updateBearingRangeBinding('contextMenuButton', normalizeMouseButtonValue(event.target.value))}
                        variant='outlined'
                    >
                        {MOUSE_BUTTON_OPTIONS.map((option) => (<MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>))}
                    </Select>
                </FormControl>
            </Box>

            <Divider/>

            <Stack spacing={2}>
                <Stack spacing={1}>
                    <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                        Bearing/Range Keyboard Modifier
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                        Click a binding, then press the modifier key you want to assign.
                    </Typography>
                </Stack>

                {BEARING_RANGE_KEYBOARD_BINDINGS.map((binding) => {
                    const currentKey = bearingRangeTool[binding.key]?.[0]
                    const bindingTarget = `bearingRangeTool:${binding.key}`
                    const isListening = listeningForBinding === bindingTarget

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
                            onClick={() => setListeningForBinding(bindingTarget)}
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

                        {persistModifierInactive && (
                            <Alert
                                severity='warning'
                                sx={{
                                    gridColumn: '1 / -1',
                                }}
                            >
                                This key has no effect while Line Persistence is set to{' '}
                                <strong>{activeBehaviorLabel}</strong>.{' '}
                                <Link
                                    component='button'
                                    type='button'
                                    onClick={() => onOpenSettingsPage?.('lookAndFeel')}
                                    sx={{verticalAlign: 'baseline'}}
                                >
                                    Change it in {SETTINGS_PAGE_TITLES.lookAndFeel}
                                </Link>
                                .
                            </Alert>
                        )}
                    </Box>)
                })}
            </Stack>

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

        <Divider/>

        <Stack spacing={2}>
            <Stack spacing={1}>
                <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                    Complete Control Reference
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Every map control combination, including fixed shortcuts that are not individually rebindable today.
                </Typography>
            </Stack>

            {controlReferenceSections.map((section) => (
                <Box
                    key={section.title}
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 2,
                    }}
                >
                    <Typography sx={{fontWeight: 'bold', mb: 1.5}}>
                        {section.title}
                    </Typography>

                    <Stack spacing={1.5}>
                        {section.entries.map((entry) => (
                            <Box
                                key={`${section.title}-${entry.action}`}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: {
                                        xs: '1fr', md: '1fr auto',
                                    },
                                    gap: 1,
                                    alignItems: 'start',
                                }}
                            >
                                <Box>
                                    <Typography sx={{fontWeight: 'bold'}}>
                                        {entry.action}
                                    </Typography>
                                    {entry.notes && (
                                        <Typography variant='body2' color='text.secondary'>
                                            {entry.notes}
                                        </Typography>
                                    )}
                                </Box>

                                <Chip
                                    label={entry.combo}
                                    size='small'
                                    sx={{
                                        justifySelf: {
                                            xs: 'start', md: 'end',
                                        },
                                        maxWidth: '100%',
                                        height: 'auto',
                                        '& .MuiChip-label': {
                                            whiteSpace: 'normal',
                                            py: 0.5,
                                        },
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </Box>
            ))}
        </Stack>

        <SettingsModalPageRestoreFooter
            pageLabel='Reset Keybinds Page'
            pageHint='Resets keybinds on this page only.'
            onPageReset={handleResetDefaults}
            onAfterResetAll={() => setListeningForBinding(null)}
        />
    </Box>)
}