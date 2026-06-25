'use client'

import {
    Box,
    FormControl,
    FormControlLabel,
    FormLabel,
    MenuItem,
    Select,
    Stack,
    Switch,
    Typography,
} from '@mui/material'
import DeferredTextField from '@/app/components/global/DeferredTextField'
import {QUALITY_PRESET_OPTIONS, useAppSettings} from '@/app/contexts/AppSettingsContext'
import {QUALITY_PRESETS} from '@/app/simulation/constants'
import {createDeferredNumericFieldConfig} from '@/app/tools/ui/deferredNumericField'

const SIMULATION_NUMERIC_FIELDS = [
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
        key: 'trackUpdateHz',
        label: 'Track update rate (Hz)',
        ...createDeferredNumericFieldConfig({min: 2, max: 30, integer: true}),
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
    {
        key: 'maxActiveFlights',
        label: 'Max active flights (global)',
        ...createDeferredNumericFieldConfig({min: 10, max: 2500, integer: true}),
    },
]

export default function SettingsModalSimulationPage() {
    const {appSettings, updateSimulationSettings} = useAppSettings()

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Simulation
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Tune sensor refresh rates, track updates, correlation range, flight
                    density, adaptive performance, and the performance overlay.
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
                    sx={{display: 'block', mt: 1}}
                />

                <FormControlLabel
                    control={(
                        <Switch
                            checked={Boolean(appSettings.showPerformanceOverlay)}
                            onChange={(event) => updateSimulationSettings({
                                showPerformanceOverlay: event.target.checked,
                            })}
                        />
                    )}
                    label='Show performance analytics overlay'
                    sx={{display: 'block', mt: 1}}
                />
            </Box>

            <Stack spacing={2}>
                {SIMULATION_NUMERIC_FIELDS.map((field) => (
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

            <FormControl size='small' fullWidth>
                <FormLabel>Quality preset</FormLabel>
                <Select
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
                    {QUALITY_PRESET_OPTIONS.map((preset) => (
                        <MenuItem key={preset} value={preset}>
                            {preset}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Stack>
    )
}
