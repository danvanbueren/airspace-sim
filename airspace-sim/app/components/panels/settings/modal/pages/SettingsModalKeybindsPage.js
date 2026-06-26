'use client'

import {useCallback, useEffect, useMemo, useState} from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import {
    Alert, Box, Button, Chip, Divider, FormControl, IconButton, InputLabel, MenuItem, Select, Slider, Stack, Tooltip, Typography,
} from '@mui/material'
import {
    MOUSE_BUTTONS, useControlBindings,
} from '../../../../../contexts/ControlBindingsContext'
import SettingsModalPageRestoreFooter from '../SettingsModalPageRestoreFooter'
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
}, {
    key: 'centerMap',
    label: 'Center Map',
    description: 'Center the camera on the cursor position without changing zoom. Leave unbound to use only the mouse button below.',
},]

const BEARING_RANGE_KEYBOARD_BINDINGS = [{
    key: 'persistModifier',
    label: 'Persist Line Modifier',
    description: 'Hold while releasing a bearing/range draw to keep the line on the map. Without this key, lines disappear when the draw button is released.',
}]

const MOUSE_CONTROL_FIELDS = [{
    key: 'dragButton',
    label: 'Map Drag Button',
    description: 'Drag the map to pan.',
}, {
    key: 'centerButton',
    label: 'Center Map Button',
    description: 'Click to center the map on the cursor without changing zoom.',
}, {
    key: 'grabButton',
    label: 'Track Select Button',
    description: 'Click a track symbol to open its Track Management window.',
}, {
    key: 'pointerButton',
    label: 'Pointer Cursor Button',
    description: 'Hold to show the pointer cursor over the map.',
}, {
    bindingSection: 'bearingRangeTool',
    key: 'drawButton',
    label: 'Bearing/Range Draw Button',
    description: 'Drag to measure bearing and range. Lines are temporary unless the persist modifier is held on release.',
}, {
    bindingSection: 'bearingRangeTool',
    key: 'contextMenuButton',
    label: 'Context Menu Button',
    description: 'Short click opens the map context menu. On a bearing/range line, opens line actions.',
}]

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

    return key
}

function toFiniteNumber(value, fallbackValue) {
    const numericValue = Array.isArray(value) ? value[0] : value
    const parsed = Number(numericValue)
    return Number.isFinite(parsed) ? parsed : fallbackValue
}

function formatBindingTarget(section, bindingKey) {
    return `${section}:${bindingKey}`
}

function parseBindingTarget(bindingTarget) {
    const [section, bindingKey] = bindingTarget.split(':')
    return {section, bindingKey}
}

function formatBindingCombo(parts) {
    return parts.filter(Boolean).join(' + ')
}

function formatFirstBindingKey(bindingKeys) {
    return bindingKeys?.length ? formatKeyName(bindingKeys[0]) : 'Unbound'
}

function buildControlReference({keyboardCamera, mapCursor, bearingRangeTool}) {
    const dragButton = getMouseButtonLabel(mapCursor.dragButton)
    const grabButton = getMouseButtonLabel(mapCursor.grabButton)
    const pointerButton = getMouseButtonLabel(mapCursor.pointerButton)
    const centerButton = getMouseButtonLabel(mapCursor.centerButton)
    const drawButton = getMouseButtonLabel(bearingRangeTool.drawButton)
    const contextMenuButton = getMouseButtonLabel(bearingRangeTool.contextMenuButton)
    const speedModifier = formatFirstBindingKey(keyboardCamera.panSpeedModifier)
    const persistModifier = formatFirstBindingKey(bearingRangeTool.persistModifier)
    const centerMapKey = formatFirstBindingKey(keyboardCamera.centerMap)
    const leftMouse = getMouseButtonLabel(MOUSE_BUTTONS.left)

    return [{
        title: 'Keyboard Camera',
        items: [{
            action: 'Pan north',
            combo: formatKeyName(keyboardCamera.panUp?.[0]),
        }, {
            action: 'Pan east',
            combo: formatKeyName(keyboardCamera.panRight?.[0]),
        }, {
            action: 'Pan south',
            combo: formatKeyName(keyboardCamera.panDown?.[0]),
        }, {
            action: 'Pan west',
            combo: formatKeyName(keyboardCamera.panLeft?.[0]),
        }, {
            action: 'Pan faster',
            combo: formatBindingCombo([speedModifier, 'movement keys']),
        }, {
            action: 'Center map at cursor',
            combo: centerMapKey !== 'Unbound' ? centerMapKey : `${centerButton} click`,
            note: centerMapKey !== 'Unbound'
                ? 'Centers on the cursor when the key is pressed. Falls back to the map center if the cursor is not over the map.'
                : 'Uses the Center Map mouse button when no key is assigned.',
        }],
    }, {
        title: 'Mouse Map Navigation',
        items: [{
            action: 'Pan map',
            combo: formatBindingCombo([dragButton, 'drag']),
        }, {
            action: 'Box zoom to area',
            combo: formatBindingCombo(['Shift', leftMouse, 'drag']),
            note: 'Shift is fixed for box zoom. Holding Shift over the map also changes the cursor to indicate box-zoom mode.',
        }, {
            action: 'Center map at cursor',
            combo: `${centerButton} click`,
        }, {
            action: 'Zoom in or out',
            combo: 'Scroll wheel',
            note: 'Scroll over the map to zoom. The Fixed Function Panel also provides Zoom In and Zoom Out buttons.',
        }],
    }, {
        title: 'Tracks',
        items: [{
            action: 'Open Track Management window',
            combo: `${grabButton} click on track`,
        }, {
            action: 'Dismiss transient track windows',
            combo: `${leftMouse} click on empty map`,
            note: 'Persistent track windows stay open until closed manually.',
        }, {
            action: 'Pointer cursor',
            combo: formatBindingCombo([pointerButton, 'hold']),
        }],
    }, {
        title: 'Bearing/Range Lines',
        items: [{
            action: 'Measure bearing/range (temporary)',
            combo: formatBindingCombo([drawButton, 'drag']),
            note: 'Shows a live measurement while dragging. The line disappears when the draw button is released.',
        }, {
            action: 'Keep bearing/range line on map',
            combo: formatBindingCombo([drawButton, 'drag', `hold ${persistModifier} on release`]),
        }, {
            action: 'Open map context menu',
            combo: `${contextMenuButton} click`,
            note: 'Must be a short click without dragging beyond the sensitivity limits below.',
        }, {
            action: 'Open line context menu',
            combo: formatBindingCombo([contextMenuButton, 'click on line']),
        }],
    }, {
        title: 'Track Management Windows',
        items: [{
            action: 'Focus window for keyboard input',
            combo: 'Click window header or body',
            note: 'While a Track Management window has keyboard custody, map camera keys are disabled so edits are not interrupted.',
        }, {
            action: 'Commit text field edits',
            combo: 'Enter or click away',
            note: 'Text and number fields commit on blur. Enter also blurs the active field.',
        }],
    }]
}

function KeyboardBindingRow({
    binding,
    bindingTarget,
    currentKey,
    isListening,
    listeningLabel,
    onStartListening,
}) {
    return (<Box
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
            onClick={() => onStartListening(bindingTarget)}
            sx={{
                minWidth: 150, justifySelf: {
                    xs: 'stretch', md: 'end',
                },
            }}
        >
            {isListening ? 'Press Key...' : formatKeyName(currentKey)}
        </Button>

        {isListening && listeningLabel && (
            <Alert
                severity='info'
                sx={{
                    gridColumn: '1 / -1',
                }}
            >
                Listening for new keybind: <strong>{listeningLabel}</strong>
            </Alert>
        )}
    </Box>)
}

export default function SettingsModalKeybindsPage() {
    const {
        controlBindings, updateControlBindings, resetControlBindings, clearAllControlBindings,
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

        const nextKey = normalizeCapturedKey(event)
        const {section, bindingKey} = parseBindingTarget(bindingTarget)

        if (section === 'bearingRangeTool') {
            updateBearingRangeKeyboardBinding(bindingKey, nextKey)
        } else {
            updateKeyboardCameraBinding(bindingKey, nextKey)
        }

        setListeningForBinding(null)
    }, [updateBearingRangeKeyboardBinding, updateKeyboardCameraBinding])

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

        const {section, bindingKey} = parseBindingTarget(listeningForBinding)
        const bindingDefinitions = section === 'bearingRangeTool'
            ? BEARING_RANGE_KEYBOARD_BINDINGS
            : KEYBOARD_BINDINGS

        return bindingDefinitions.find((binding) => binding.key === bindingKey)?.label ?? null
    }, [listeningForBinding])

    const controlReference = useMemo(() => buildControlReference({
        keyboardCamera,
        mapCursor,
        bearingRangeTool,
    }), [keyboardCamera, mapCursor, bearingRangeTool])

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
                const bindingTarget = formatBindingTarget('keyboardCamera', binding.key)
                const currentKey = keyboardCamera[binding.key]?.[0]

                return (<KeyboardBindingRow
                    key={binding.key}
                    binding={binding}
                    bindingTarget={bindingTarget}
                    currentKey={currentKey}
                    isListening={listeningForBinding === bindingTarget}
                    listeningLabel={currentListeningLabel}
                    onStartListening={setListeningForBinding}
                />)
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
                {MOUSE_CONTROL_FIELDS.map((field) => {
                    const bindingSection = field.bindingSection ?? 'mapCursor'
                    const bindings = bindingSection === 'bearingRangeTool' ? bearingRangeTool : mapCursor
                    const updateBinding = bindingSection === 'bearingRangeTool'
                        ? updateBearingRangeBinding
                        : updateMapCursorBinding
                    const labelId = `${field.key}-label`

                    return (<FormControl fullWidth key={field.key}>
                        <InputLabel id={labelId}>
                            {field.label}
                        </InputLabel>
                        <Select
                            labelId={labelId}
                            label={field.label}
                            value={normalizeMouseButtonValue(bindings[field.key])}
                            renderValue={(selected) => getMouseButtonLabel(selected)}
                            onChange={(event) => updateBinding(field.key, normalizeMouseButtonValue(event.target.value))}
                            variant='outlined'
                        >
                            {MOUSE_BUTTON_OPTIONS.map((option) => (<MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>))}
                        </Select>
                    </FormControl>)
                })}
            </Box>

            <Divider/>

            <Stack spacing={1}>
                <Typography variant='h6' sx={{fontWeight: 'bold'}}>
                    Bearing/Range Keyboard Modifier
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                    Click a binding, then press the key you want to assign.
                </Typography>
            </Stack>

            <Stack spacing={2}>
                {BEARING_RANGE_KEYBOARD_BINDINGS.map((binding) => {
                    const bindingTarget = formatBindingTarget('bearingRangeTool', binding.key)
                    const currentKey = bearingRangeTool[binding.key]?.[0]

                    return (<KeyboardBindingRow
                        key={binding.key}
                        binding={binding}
                        bindingTarget={bindingTarget}
                        currentKey={currentKey}
                        isListening={listeningForBinding === bindingTarget}
                        listeningLabel={currentListeningLabel}
                        onStartListening={setListeningForBinding}
                    />)
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
                    All map and operator controls, including fixed combinations that are not individually rebindable. Combos update when you change bindings above.
                </Typography>
            </Stack>

            {controlReference.map((section) => (<Stack key={section.title} spacing={1.5}>
                <Typography sx={{fontWeight: 'bold'}}>
                    {section.title}
                </Typography>

                <Stack spacing={1}>
                    {section.items.map((item) => (<Box
                        key={`${section.title}-${item.action}`}
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr', md: '1fr auto',
                            },
                            gap: 1,
                            alignItems: 'start',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 2,
                            p: 2,
                        }}
                    >
                        <Box>
                            <Typography sx={{fontWeight: 'bold'}}>
                                {item.action}
                            </Typography>
                            {item.note && (
                                <Typography variant='body2' color='text.secondary'>
                                    {item.note}
                                </Typography>
                            )}
                        </Box>

                        <Chip
                            label={item.combo}
                            size='small'
                            sx={{
                                justifySelf: {
                                    xs: 'start', md: 'end',
                                },
                                maxWidth: {
                                    xs: '100%', md: 360,
                                },
                                height: 'auto',
                                '& .MuiChip-label': {
                                    whiteSpace: 'normal',
                                    py: 0.75,
                                },
                            }}
                        />
                    </Box>))}
                </Stack>
            </Stack>))}
        </Stack>

        <SettingsModalPageRestoreFooter
            pageLabel='Reset Keybinds Page'
            pageHint='Resets keybinds on this page only.'
            onPageReset={handleResetDefaults}
            onAfterResetAll={() => setListeningForBinding(null)}
        />
    </Box>)
}