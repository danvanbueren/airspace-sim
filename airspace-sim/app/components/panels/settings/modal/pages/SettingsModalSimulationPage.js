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
    TextField,
    Typography,
} from '@mui/material'
import {QUALITY_PRESET_OPTIONS, useAppSettings} from '@/app/contexts/AppSettingsContext'
import {QUALITY_PRESETS} from '@/app/simulation/constants'

export default function SettingsModalSimulationPage() {
    const {appSettings, updateSimulationSettings} = useAppSettings()

    const updateNumericField = (field) => (event) => {
        updateSimulationSettings({
            [field]: event.target.value,
        })
    }

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant='h6' sx={{fontWeight: 'bold', mb: 1}}>
                    Simulation
                </Typography>
                <Typography variant='body2' color='text.secondary' sx={{mb: 2}}>
                    Configure sensor refresh rates, track update frequency, correlation range,
                    global flight density, and adaptive performance behavior.
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
            </Box>

            <Stack spacing={2}>
                <TextField
                    label='Radar refresh (ms)'
                    type='number'
                    size='small'
                    value={appSettings.radarRefreshMs}
                    onChange={updateNumericField('radarRefreshMs')}
                    slotProps={{htmlInput: {min: 500, max: 30000, step: 100}}}
                />
                <TextField
                    label='IFF refresh (ms)'
                    type='number'
                    size='small'
                    value={appSettings.iffRefreshMs}
                    onChange={updateNumericField('iffRefreshMs')}
                    slotProps={{htmlInput: {min: 250, max: 10000, step: 50}}}
                />
                <TextField
                    label='Track update rate (Hz)'
                    type='number'
                    size='small'
                    value={appSettings.trackUpdateHz}
                    onChange={updateNumericField('trackUpdateHz')}
                    slotProps={{htmlInput: {min: 2, max: 30, step: 1}}}
                />
                <TextField
                    label='Correlation threshold (NM)'
                    type='number'
                    size='small'
                    value={appSettings.correlationThresholdNm}
                    onChange={updateNumericField('correlationThresholdNm')}
                    slotProps={{htmlInput: {min: 0.5, max: 50, step: 0.5}}}
                />
                <TextField
                    label='Plot association threshold (NM)'
                    type='number'
                    size='small'
                    value={appSettings.plotAssociationThresholdNm}
                    onChange={updateNumericField('plotAssociationThresholdNm')}
                    slotProps={{htmlInput: {min: 0.5, max: 20, step: 0.5}}}
                />
                <TextField
                    label='Max active flights (global)'
                    type='number'
                    size='small'
                    value={appSettings.maxActiveFlights}
                    onChange={updateNumericField('maxActiveFlights')}
                    slotProps={{htmlInput: {min: 10, max: 2500, step: 50}}}
                />
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
