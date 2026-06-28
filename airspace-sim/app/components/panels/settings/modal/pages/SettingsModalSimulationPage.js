'use client'

import {
    Box,
    Divider,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    Typography,
} from '@mui/material'
import DeferredTextField from '@/app/components/global/DeferredTextField'
import {QUALITY_PRESET_CUSTOM, QUALITY_PRESET_OPTIONS, useAppSettings} from '@/app/contexts/AppSettingsContext'
import {QUALITY_PRESET_LABELS, QUALITY_PRESETS} from '@/app/simulation/constants'
import {createDeferredNumericFieldConfig} from '@/app/tools/ui/deferredNumericField'

const SIMULATION_OPTION_FIELDS = [
    {
        key: 'radarRefreshMs',
        label: 'Radar refresh (ms)',
        ...createDeferredNumericFieldConfig({min: 500, max: 30000, integer: true}),
    },
    {
        key: 'iffRefreshMs',
        label: 'IFF refresh (ms)',
        ...createDeferredNumericFieldConfig({min: 250, max: 10000, integer: true}),
    },
    {
        key: 'correlationThresholdNm',
        label: 'Correlation threshold (NM)',
        ...createDeferredNumericFieldConfig({min: 0.5, max: 50}),
    },
    {
        key: 'plotAssociationThresholdNm',
        label: 'Plot association threshold (NM)',
        ...createDeferredNumericFieldConfig({min: 0.5, max: 20}),
    },
]

const SIMULATION_QUALITY_FIELDS = [
    {
        key: 'trackUpdateHz',
        label: 'Track update rate (Hz)',
        ...createDeferredNumericFieldConfig({min: 2, max: 30, integer: true}),
    },
    {
        key: 'maxActiveFlights',
        label: 'Max active flights (global)',
        ...createDeferredNumericFieldConfig({min: 10, max: 2500, integer: true}),
    },
]

export default function SettingsModalSimulationPage() {
    const {appSettings, updateSimulationSettings} = useAppSettings()

    return (
        <Stack spacing={3} divider={<Divider/>}>
            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Options
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Control whether the simulation engine runs and tune sensor refresh
                    rates plus correlation thresholds.
                </Typography>

                <FormControlLabel
                    control={(
                        <Switch
                            checked={Boolean(appSettings.simulationEnabled)}
                            onChange={(event) => updateSimulationSettings({
                                simulationEnabled: event.target.checked,
                            })}
                        />
                    )}
                    label='Enable simulation engine'
                />

                <Stack spacing={2} sx={{mt: 2}}>
                    {SIMULATION_OPTION_FIELDS.map((field) => (
                        <DeferredTextField
                            key={field.key}
                            label={field.label}
                            size='small'
                            type='text'
                            inputMode='decimal'
                            committedValue={appSettings[field.key]}
                            onCommit={(value) => updateSimulationSettings({[field.key]: value})}
                            formatCommitted={field.formatCommitted}
                            getDraftError={field.getDraftError}
                            parseDraft={field.parseDraft}
                        />
                    ))}
                </Stack>
            </Box>

            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Quality
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Set flight density, track update rate, adaptive performance, and
                    quality presets.
                </Typography>

                <FormControlLabel
                    control={(
                        <Switch
                            checked={Boolean(appSettings.adaptivePerformanceEnabled)}
                            onChange={(event) => updateSimulationSettings({
                                adaptivePerformanceEnabled: event.target.checked,
                            })}
                        />
                    )}
                    label='Adaptive performance balancing'
                />
                <Typography variant='caption' color='text.secondary' sx={{display: 'block', mt: -1, mb: 2}}>
                    Monitors frame times and gradually lowers the simulation tick rate when the
                    system is under load. Does not delete flights or trim the global fleet. The
                    performance overlay throttle percentage shows how far the engine has backed
                    off from the configured track update rate.
                </Typography>

                <FormControlLabel
                    control={(
                        <Switch
                            checked={Boolean(appSettings.viewportBasedTrackDroppingEnabled)}
                            onChange={(event) => updateSimulationSettings({
                                viewportBasedTrackDroppingEnabled: event.target.checked,
                            })}
                        />
                    )}
                    label='Viewport-based track dropping'
                />
                <Typography variant='caption' color='text.secondary' sx={{display: 'block', mt: -1, mb: 2}}>
                    When enabled, sensor scans are limited to the visible map area (plus padding).
                    Tracks that leave the viewport eventually go stale and may auto-drop. When
                    disabled, the engine scans the full global fleet so all firm tracks keep
                    receiving sensor updates regardless of map position.
                </Typography>

                <Stack spacing={2} sx={{mt: 2}}>
                    {SIMULATION_QUALITY_FIELDS.map((field) => (
                        <DeferredTextField
                            key={field.key}
                            label={field.label}
                            size='small'
                            type='text'
                            inputMode='decimal'
                            committedValue={appSettings[field.key]}
                            onCommit={(value) => updateSimulationSettings({[field.key]: value})}
                            formatCommitted={field.formatCommitted}
                            getDraftError={field.getDraftError}
                            parseDraft={field.parseDraft}
                        />
                    ))}
                </Stack>

                <FormControl size='small' fullWidth sx={{mt: 2}}>
                    <InputLabel id='quality-preset-label'>Quality preset</InputLabel>
                    <Select
                        labelId='quality-preset-label'
                        label='Quality preset'
                        value={appSettings.qualityPreset}
                        onChange={(event) => {
                            const preset = QUALITY_PRESETS[event.target.value] ?? QUALITY_PRESETS.balanced

                            updateSimulationSettings({
                                qualityPreset: event.target.value,
                                trackUpdateHz: preset.trackUpdateHz,
                                maxActiveFlights: preset.maxActiveFlights
                                    ?? preset.maxTruthAircraftInViewport,
                            })
                        }}
                    >
                        {appSettings.qualityPreset === QUALITY_PRESET_CUSTOM && (
                            <MenuItem value={QUALITY_PRESET_CUSTOM} disabled>
                                {QUALITY_PRESET_LABELS[QUALITY_PRESET_CUSTOM]}
                            </MenuItem>
                        )}
                        {QUALITY_PRESET_OPTIONS.map((preset) => (
                            <MenuItem key={preset} value={preset}>
                                {QUALITY_PRESET_LABELS[preset] ?? preset}
                            </MenuItem>
                        ))}
                    </Select>
                    <Typography variant='caption' color='text.secondary' sx={{display: 'block', mt: 1}}>
                        Low (400 flights, 5 Hz) for lighter hardware. Balanced (800 flights, 10 Hz)
                        is the default. High (1,000 flights, 12 Hz) increases density and update
                        rate. Ultra (1,500 flights, 10 Hz) targets maximum global traffic.
                    </Typography>
                </FormControl>
            </Box>
        </Stack>
    )
}
