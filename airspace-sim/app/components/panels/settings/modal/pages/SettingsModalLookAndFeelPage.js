'use client'

import {useEffect, useState} from 'react'
import {
    Box,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Stack,
    Typography,
} from '@mui/material'
import {
    BEARING_RANGE_BEHAVIOR_MODES,
    DEFAULT_APP_SETTINGS,
    GRID_REFERENCE_SYSTEMS,
    useAppSettings,
} from '@/app/contexts/AppSettingsContext'
import {
    COLOR_MODE_OPTIONS,
    DEFAULT_COLOR_MODE,
    useColorMode,
} from '@/app/contexts/CustomThemeContext'
import {
    DEFAULT_CONTROL_BINDINGS,
    useControlBindings,
} from '@/app/contexts/ControlBindingsContext'
import {
    formatCoordinatePairForGridReferenceSystem,
} from '@/app/tools/formatting/GridReferenceFormatting'
import SettingsModalPageRestoreFooter from '../SettingsModalPageRestoreFooter'

const GRID_REFERENCE_EXAMPLE_LAT = 38.8977
const GRID_REFERENCE_EXAMPLE_LNG = -77.0365

function toFiniteNumber(value, fallbackValue) {
    const numericValue = Array.isArray(value) ? value[0] : value
    const parsed = Number(numericValue)
    return Number.isFinite(parsed) ? parsed : fallbackValue
}

export default function SettingsModalLookAndFeelPage() {
    const {
        appSettings,
        setGridReferenceSystem,
        setBearingRangeBehavior,
        updateAppSettings,
    } = useAppSettings()
    const {controlBindings, updateControlBindings} = useControlBindings()
    const {mode: colorMode, setColorMode} = useColorMode()
    const keyboardCamera = controlBindings.keyboardCamera

    const [platform, setPlatform] = useState('generic')
    const [zoomScale, setZoomScale] = useState(1.0)
    const [devicePixelRatioOnLoad, setDevicePixelRatioOnLoad] = useState(null)

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase()
        let detectedPlatform = 'generic'
        if (userAgent.includes('mac')) {
            detectedPlatform = 'mac'
        } else if (userAgent.includes('win')) {
            detectedPlatform = 'win'
        } else if (userAgent.includes('linux')) {
            detectedPlatform = 'linux'
        }
        setPlatform(detectedPlatform)

        const initialDPR = window.devicePixelRatio || 1.0
        setDevicePixelRatioOnLoad(initialDPR)
        setZoomScale(initialDPR)

        const handleResize = () => {
            setZoomScale(window.devicePixelRatio || 1.0)
        }

        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    const relativeZoom = devicePixelRatioOnLoad ? (zoomScale / devicePixelRatioOnLoad) : 1.0
    const isMac = platform === 'mac'
    const zoomOutLabel = isMac ? '⌘ -' : 'Ctrl -'
    const zoomInLabel = isMac ? '⌘ +' : 'Ctrl +'
    const resetLabel = isMac ? '⌘ 0' : 'Ctrl 0'

    const updateKeyboardCameraNumber = (bindingKey, nextValue) => {
        updateControlBindings((currentBindings) => ({
            ...currentBindings,
            keyboardCamera: {
                ...currentBindings.keyboardCamera,
                [bindingKey]: toFiniteNumber(nextValue, currentBindings.keyboardCamera[bindingKey]),
            },
        }))
    }

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Color Mode
                </Typography>

                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Map basemap and application theme.
                </Typography>

                <FormControl fullWidth size='small'>
                    <InputLabel id='color-mode-label'>
                        Color Mode
                    </InputLabel>
                    <Select
                        labelId='color-mode-label'
                        label='Color Mode'
                        value={colorMode}
                        onChange={(event) => setColorMode(event.target.value)}
                    >
                        {Object.values(COLOR_MODE_OPTIONS).map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography
                    variant='caption'
                    component='div'
                    sx={{
                        mt: 1,
                        color: 'grey.600',
                    }}
                >
                    {Object.values(COLOR_MODE_OPTIONS).map((option, index) => (
                        <span key={option.value}>
                            {index > 0 ? ' · ' : ''}
                            {option.label}: {option.description}
                        </span>
                    ))}
                </Typography>
            </Box>

            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Grid Reference System
                </Typography>

                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Coordinate format for the cursor tooltip and context menu.
                </Typography>

                <FormControl fullWidth size='small'>
                    <InputLabel id='grid-reference-system-label'>
                        Display Format
                    </InputLabel>
                    <Select
                        labelId='grid-reference-system-label'
                        label='Display Format'
                        value={appSettings.gridReferenceSystem}
                        onChange={(event) => setGridReferenceSystem(event.target.value)}
                    >
                        {Object.values(GRID_REFERENCE_SYSTEMS).map((system) => (
                            <MenuItem key={system.value} value={system.value}>
                                {system.label} — {system.description}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography
                    variant='caption'
                    color='text.secondary'
                    component='div'
                    sx={{display: 'block', mt: 1, fontFamily: 'monospace'}}
                >
                    Example:{' '}
                    {formatCoordinatePairForGridReferenceSystem(
                        GRID_REFERENCE_EXAMPLE_LAT,
                        GRID_REFERENCE_EXAMPLE_LNG,
                        appSettings.gridReferenceSystem,
                    ).join(' · ')}
                </Typography>
            </Box>

            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Bearing/Range Behavior
                </Typography>

                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Choose whether drawn measurements stay on the map by default. The persist modifier
                    in Settings → Keybinds still applies for modes that use it.
                </Typography>

                <FormControl fullWidth size='small'>
                    <InputLabel id='bearing-range-behavior-label'>
                        Line Persistence
                    </InputLabel>
                    <Select
                        labelId='bearing-range-behavior-label'
                        label='Line Persistence'
                        value={appSettings.bearingRangeBehavior}
                        onChange={(event) => setBearingRangeBehavior(event.target.value)}
                    >
                        {Object.values(BEARING_RANGE_BEHAVIOR_MODES).map((mode) => (
                            <MenuItem key={mode.value} value={mode.value}>
                                {mode.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Typography
                    variant='caption'
                    component='div'
                    sx={{
                        mt: 1,
                        color: 'grey.600',
                    }}
                >
                    {Object.values(BEARING_RANGE_BEHAVIOR_MODES).map((mode, index) => (
                        <span key={mode.value}>
                            {index > 0 ? ' · ' : ''}
                            {mode.label}: {mode.description}
                        </span>
                    ))}
                </Typography>
            </Box>

            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Camera Speed
                </Typography>

                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Keyboard pan rate and multiplier applied while holding the speed modifier key.
                </Typography>

                <Stack spacing={2}>
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
            </Box>

            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Browser Zoom Scale
                </Typography>

                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Reflects the current native browser zoom level (adjusted via system or browser zoom settings).
                </Typography>

                <Stack direction='row' spacing={2} sx={{alignItems: 'center', width: '100%'}}>
                    <Chip
                        label={zoomOutLabel}
                        variant='outlined'
                        size='small'
                        sx={{fontFamily: 'monospace', fontWeight: 'bold'}}
                    />
                    <Slider
                        value={relativeZoom}
                        min={0.5}
                        max={3.0}
                        step={0.05}
                        sx={{
                            flexGrow: 1,
                            pointerEvents: 'none',
                            '& .MuiSlider-thumb': {
                                display: 'none',
                            },
                            '& .MuiSlider-track': {
                                background: 'linear-gradient(90deg, #1976d2, #2e7d32)',
                                border: 'none',
                            },
                            '& .MuiSlider-rail': {
                                opacity: 0.28,
                            },
                        }}
                    />
                    <Chip
                        label={zoomInLabel}
                        variant='outlined'
                        size='small'
                        sx={{fontFamily: 'monospace', fontWeight: 'bold'}}
                    />
                </Stack>

                <Typography
                    variant='caption'
                    color='text.secondary'
                    component='div'
                    sx={{display: 'block', mt: 1}}
                >
                    Current Zoom: {Math.round(relativeZoom * 100)}%{' '}
                    {devicePixelRatioOnLoad && devicePixelRatioOnLoad !== 1 && `(Device backing scale: ${Math.round(devicePixelRatioOnLoad * 100)}%)`}{' '}
                    · Reset zoom anytime using{' '}
                    <Box
                        component='span'
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 'bold',
                            px: 0.5,
                            py: 0.2,
                            bgcolor: 'action.selected',
                            borderRadius: 1,
                        }}
                    >
                        {resetLabel}
                    </Box>
                </Typography>
            </Box>

            <SettingsModalPageRestoreFooter
                pageLabel='Reset Look & Feel Page'
                pageHint='Resets look and feel settings on this page only.'
                onPageReset={() => {
                    setColorMode(DEFAULT_COLOR_MODE)
                    updateAppSettings((currentSettings) => ({
                        ...currentSettings,
                        gridReferenceSystem: DEFAULT_APP_SETTINGS.gridReferenceSystem,
                        bearingRangeBehavior: DEFAULT_APP_SETTINGS.bearingRangeBehavior,
                    }))
                    updateControlBindings((currentBindings) => ({
                        ...currentBindings,
                        keyboardCamera: {
                            ...currentBindings.keyboardCamera,
                            regularPanSpeed: DEFAULT_CONTROL_BINDINGS.keyboardCamera.regularPanSpeed,
                            panSpeedMultiplier: DEFAULT_CONTROL_BINDINGS.keyboardCamera.panSpeedMultiplier,
                        },
                    }))
                }}
            />
        </Stack>
    )
}
